// src/screens/route/Line5RouteScreen.js
import React, { useRef, useState, useEffect } from "react";
import {
  View, Animated, PanResponder, Dimensions,
  ActivityIndicator, Image, Text, Alert, TouchableOpacity
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import {
  collection, addDoc, serverTimestamp, getDocs, query, where
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");
const IMG_ORIGINAL_WIDTH = 3376;
const IMG_ORIGINAL_HEIGHT = 3375;

const TYPE_COLORS = {
  EV: "#14CAC9",
  ES: "#F4A300",
  TO: "#3878FF",
  DT: "#5C7AEA",
  WL: "#9C27B0",
  VO: "#FF7043",
  NU: "#FFB6C1",
  LO: "#8BC34A",
};

export default function Line5RouteScreen() {
  const route = useRoute();
  const { stationName = "여의도", type = "EV", imageUrl = null } = route.params || {};

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [tempPoints, setTempPoints] = useState([]);
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const initialDistance = useRef(null);
  const baseScale = useRef(1);

  // ✅ Firestore 저장
  const saveToFirebase = async (coordData) => {
    try {
      const docRef = await addDoc(collection(db, "station_coords"), {
        ...coordData,
        line: "5호선",
        created_at: serverTimestamp(),
      });
      console.log("✅ Firestore 저장 완료:", docRef.id);
    } catch (error) {
      console.error("🚨 Firestore 저장 오류:", error);
      Alert.alert("오류", "Firebase 저장 중 문제가 발생했습니다.");
    }
  };

  // ✅ Firestore에서 좌표 불러오기
  const loadAllCoords = async () => {
    try {
      const q = query(
        collection(db, "station_coords"),
        where("line", "==", "5호선"),
        where("station", "==", stationName),
        where("type", "==", type)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => doc.data());
      console.log(`📡 ${stationName} (${type}) 불러온 좌표:`, fetched.length);

      const mapped = fetched.map((p) => ({
        cx: (p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width,
        cy: (p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height,
        type: p.type,
      }));
      setTempPoints(mapped);
    } catch (err) {
      console.error("🚨 Firestore 불러오기 오류:", err);
    }
  };

  useEffect(() => {
    if (imgLayout.width > 1) loadAllCoords();
  }, [imgLayout, stationName, type]);

  // ✅ 로컬 JSON → Firebase 업로드
  const importLocalToFirebase = async () => {
    try {
      const filePath = `${FileSystem.documentDirectory}${stationName}_coords.json`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) {
        Alert.alert("로컬 파일 없음", `${stationName}_coords.json이 없습니다.`);
        return;
      }
      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content || "[]");
      const sameType = data.filter((d) => d.type === type);
      if (sameType.length === 0) {
        Alert.alert("업로드할 좌표 없음", `${type} 타입 데이터가 없습니다.`);
        return;
      }

      let success = 0, fail = 0;
      for (const p of sameType) {
        try {
          await saveToFirebase({
            station: stationName,
            x: p.x,
            y: p.y,
            type: p.type,
          });
          success++;
        } catch {
          fail++;
        }
      }
      Alert.alert("이관 완료", `성공: ${success} / 실패: ${fail}`);
      loadAllCoords();
    } catch (err) {
      console.error("🚨 이관 오류:", err);
      Alert.alert("오류", "로컬 데이터 이관 중 문제가 발생했습니다.");
    }
  };

  const undoLast = () => {
    setTempPoints((prev) => prev.slice(0, -1));
    Alert.alert("✅", "마지막 좌표가 삭제되었습니다. (Firestore에는 영향 없음)");
  };

  // ✅ 줌 & 터치 이벤트
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          const { locationX, locationY } = touches[0];
          const currentScale = scale.__getValue();
          const origX = Math.round((locationX / imgLayout.width) * IMG_ORIGINAL_WIDTH / currentScale);
          const origY = Math.round((locationY / imgLayout.height) * IMG_ORIGINAL_HEIGHT / currentScale);

          Alert.alert(
            "좌표 저장",
            `${stationName}\n(${origX}, ${origY})\n저장할까요?`,
            [
              { text: "취소", style: "cancel" },
              {
                text: "저장",
                onPress: async () => {
                  const coord = { station: stationName, x: origX, y: origY, type };
                  setTempPoints((p) => [
                    ...p,
                    {
                      cx: (origX / IMG_ORIGINAL_WIDTH) * imgLayout.width,
                      cy: (origY / IMG_ORIGINAL_HEIGHT) * imgLayout.height,
                      type,
                    },
                  ]);
                  await saveToFirebase(coord);
                },
              },
            ]
          );
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const t = evt.nativeEvent.touches;
        if (t.length === 2) {
          const dx = t[0].pageX - t[1].pageX, dy = t[0].pageY - t[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (initialDistance.current == null) {
            initialDistance.current = distance;
            baseScale.current = scale.__getValue();
          } else {
            const newScale = (distance / initialDistance.current) * baseScale.current;
            Animated.spring(scale, {
              toValue: Math.min(Math.max(newScale, 1), 3.5),
              useNativeDriver: false,
            }).start();
          }
        } else if (t.length === 1 && !initialDistance.current)
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gestureState);
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
        pan.flattenOffset();
      },
    })
  ).current;

  if (!imageUrl)
    return (
      <View style={s.center}>
        <ActivityIndicator color="#14CAC9" size="large" />
      </View>
    );

  return (
    <View style={s.container}>
      <Text style={s.header}>
        {stationName} - {getTypeLabel(type)} 좌표 등록 (5호선)
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <TouchableOpacity style={s.btn} onPress={undoLast}>
          <Text style={s.btnText}>↩️ 되돌리기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: "#3878FF" }]} onPress={loadAllCoords}>
          <Text style={s.btnText}>📡 불러오기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: "#6B7280" }]} onPress={importLocalToFirebase}>
          <Text style={s.btnText}>📥 로컬→Firebase</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[s.imageWrapper, { transform: [...pan.getTranslateTransform(), { scale }] }]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={s.image}
          resizeMode="contain"
          onLayout={(e) => setImgLayout(e.nativeEvent.layout)}
        />
        <Svg style={[s.overlay, { width: imgLayout.width, height: imgLayout.height }]}>
          {tempPoints.map((p, i) => (
            <Circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={10}
              fill={TYPE_COLORS[p.type] || "#14CAC9"}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

function getTypeLabel(t) {
  const names = {
    EV: "엘리베이터",
    ES: "에스컬레이터",
    TO: "화장실",
    DT: "장애인 화장실",
    WL: "휠체어 리프트",
    VO: "음성유도기",
    NU: "수유실",
    LO: "보관함",
  };
  return names[t] || "시설";
}

const s = {
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "700", textAlign: "center", marginVertical: 10 },
  imageWrapper: { width, height: height * 0.6, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, left: 0 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  btn: {
    backgroundColor: "#14CAC9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "center",
    margin: 6,
  },
  btnText: { color: "#fff", fontWeight: "600" },
};
