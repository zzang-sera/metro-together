// src/screens/route/Line1RouteScreen.js
import React, { useRef, useState, useEffect } from "react";
import {
  View, Animated, PanResponder, Dimensions,
  ActivityIndicator, Image, Text, Alert, TouchableOpacity
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";

import { getApps } from "firebase/app";
import { collection, addDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");
const IMG_ORIGINAL_WIDTH = 3376;
const IMG_ORIGINAL_HEIGHT = 3375;

const TYPE_COLORS = {
  EV: "#14CAC9", ES: "#F4A300", TO: "#3878FF",
  DT: "#5C7AEA", WL: "#9C27B0", VO: "#FF7043",
  NU: "#FFB6C1", LO: "#8BC34A"
};

export default function Line1RouteScreen() {
  const route = useRoute();
  const { stationName = "서울역", type = "EV", imageUrl = null, line = "1호선" } = route.params || {};

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [tempPoints, setTempPoints] = useState([]);

  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const initialDistance = useRef(null);
  const baseScale = useRef(1);

  const coordsFilePath = `${FileSystem.documentDirectory}coords.json`;

  const appendToCoordsFile = async (newCoord) => {
    try {
      const info = await FileSystem.getInfoAsync(coordsFilePath);
      let arr = [];
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(coordsFilePath);
        arr = JSON.parse(content || "[]");
      }
      arr.push(newCoord);
      await FileSystem.writeAsStringAsync(coordsFilePath, JSON.stringify(arr, null, 2));
      console.log("🗄️ 백업 완료 (1건)");
    } catch (err) {
      console.error("🚨 로컬 백업 오류:", err);
    }
  };

  // 👉 콘솔로 coords.json 내용 보기 버튼용
  const showCoordsFile = async () => {
    try {
      console.log("📂 FileSystem.documentDirectory:", FileSystem.documentDirectory);
      const info = await FileSystem.getInfoAsync(coordsFilePath);
      if (!info.exists) return console.log("⚠️ coords.json 파일이 없습니다.");
      const content = await FileSystem.readAsStringAsync(coordsFilePath);
      console.log("📄 coords.json 내용:", content);
      Alert.alert("완료", "콘솔에 coords.json 내용이 출력되었습니다.");
    } catch (err) {
      console.error("🚨 파일 읽기 오류:", err);
    }
  };

  // 👉 현재 역/타입/라인에 해당하는 좌표 목록 콘솔로 보기
  const showAllCoords = async () => {
    try {
      const info = await FileSystem.getInfoAsync(coordsFilePath);
      if (!info.exists) return Alert.alert("알림", "로컬에 저장된 좌표가 없습니다.");
      const content = await FileSystem.readAsStringAsync(coordsFilePath);
      const arr = JSON.parse(content || "[]");
      const filtered = arr.filter(
        (d) => d.station === stationName && d.type === type && (d.line || line) === line
      );
      console.log(`📋 ${stationName} (${line}, ${type}) 좌표 목록 (${filtered.length}건):`, filtered);
      Alert.alert("완료", `콘솔에 ${filtered.length}건을 출력했습니다.`);
    } catch (err) {
      console.error("🚨 목록 보기 오류:", err);
    }
  };

  // 👉 화면에서만 최근 점 1개 되돌리기(파일/파이어스토어엔 영향 없음)
  const undoLast = () => {
    setTempPoints((prev) => prev.slice(0, -1));
    Alert.alert("✅", "마지막 좌표가 화면에서 제거되었습니다.");
  };

  // 로컬에서 현재 역/타입/라인 점들 로드해 화면에 표시
  const loadFromLocalFile = async () => {
    try {
      const info = await FileSystem.getInfoAsync(coordsFilePath);
      if (!info.exists) return;
      const content = await FileSystem.readAsStringAsync(coordsFilePath);
      const arr = JSON.parse(content || "[]");
      const filtered = arr.filter(
        (d) => d.station === stationName && d.type === type && (d.line || line) === line
      );
      const mapped = filtered.map((p) => ({
        cx: (p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width,
        cy: (p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height,
        type: p.type,
      }));
      setTempPoints(mapped);
    } catch (err) {
      console.error("🚨 로컬 불러오기 오류:", err);
    }
  };

  useEffect(() => {
    if (imgLayout.width > 1) loadFromLocalFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLayout.width, imgLayout.height, stationName, type, line]);

  const saveToFirebase = async (coordData) => {
    try {
      const apps = getApps();
      console.log("🔥 Firebase Apps:", apps.length);
      console.log("🔥 Firestore project:", getFirestore().app.options.projectId);

      const docRef = await addDoc(collection(db, "station_coords"), {
        ...coordData,
        line,
        created_at: serverTimestamp(),
      });
      console.log("✅ Firestore 저장 완료:", docRef.id);
    } catch (error) {
      console.error("🚨 Firestore 저장 오류:", error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          const { locationX, locationY } = touches[0];
          const currentScale = scale.__getValue();

          const unscaledX = locationX / currentScale;
          const unscaledY = locationY / currentScale;
          const origX = Math.round((unscaledX / imgLayout.width) * IMG_ORIGINAL_WIDTH);
          const origY = Math.round((unscaledY / imgLayout.height) * IMG_ORIGINAL_HEIGHT);

          Alert.alert(
            "좌표 저장",
            `${stationName} (${line})\n${type} → (${origX}, ${origY})\n저장할까요?`,
            [
              { text: "취소", style: "cancel" },
              {
                text: "저장",
                onPress: () => {
                  const coord = {
                    station: stationName,
                    x: origX,
                    y: origY,
                    type,
                    line,
                    timestamp: new Date().toISOString(),
                  };
                  setTempPoints((prev) => [
                    ...prev,
                    {
                      cx: (origX / IMG_ORIGINAL_WIDTH) * imgLayout.width,
                      cy: (origY / IMG_ORIGINAL_HEIGHT) * imgLayout.height,
                      type,
                    },
                  ]);
                  appendToCoordsFile(coord);
                  saveToFirebase(coord);
                  console.log(`✅ ${stationName} ${type} 좌표 저장 완료`);
                },
              },
            ],
            { cancelable: true }
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
        } else if (t.length === 1 && !initialDistance.current) {
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gestureState);
        }
      },

      onPanResponderRelease: () => {
        initialDistance.current = null;
        pan.flattenOffset();
        const currentScale = scale.__getValue();
        if (currentScale < 1) {
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
          baseScale.current = 1;
        } else {
          baseScale.current = currentScale;
        }
      },
    })
  ).current;

  if (!imageUrl)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#14CAC9" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {stationName} - {getTypeLabel(type)} 좌표 등록 ({line})
      </Text>

      {/* 👉 여기 한 줄에 버튼 3개: 되돌리기 / 좌표 목록 보기 / coords.json 보기 */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btn} onPress={undoLast}>
          <Text style={styles.btnText}>↩️ 되돌리기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#10B981" }]} onPress={showAllCoords}>
          <Text style={styles.btnText}>📋 좌표 목록 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#3878FF" }]} onPress={showCoordsFile}>
          <Text style={styles.btnText}>📄 coords.json 보기</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.imageWrapper, { transform: [...pan.getTranslateTransform(), { scale }] }]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
          onLayout={(e) => setImgLayout(e.nativeEvent.layout)}
          onLoad={() => console.log("🖼️ stationImage loaded:", imageUrl)}
        />
        <Svg style={[styles.overlay, { width: imgLayout.width, height: imgLayout.height }]}>
          {tempPoints.map((p, i) => (
            <Circle key={i} cx={p.cx} cy={p.cy} r={10} fill={TYPE_COLORS[p.type] || "#14CAC9"} stroke="#fff" strokeWidth={2} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

function getTypeLabel(t) {
  const names = { EV: "엘리베이터", ES: "에스컬레이터", TO: "화장실", DT: "장애인 화장실", WL: "휠체어 리프트", VO: "음성유도기", NU: "수유실", LO: "보관함" };
  return names[t] || "시설";
}

const styles = {
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "700", textAlign: "center", marginVertical: 10 },
  buttonRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 6, paddingHorizontal: 8 },
  btn: { backgroundColor: "#14CAC9", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "600" },
  imageWrapper: { width, height: height * 0.6, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, left: 0 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
};
