// src/screens/station/BarrierFreeMapScreen.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import * as FileSystem from "expo-file-system";

const { width: screenW, height: screenH } = Dimensions.get("window");
// ⚠️ 반드시 실제 원본 픽셀 입력 (이미지 교체 시 같이 업데이트)
const IMG_ORIGINAL_WIDTH = 3376;
const IMG_ORIGINAL_HEIGHT = 3375;

const TYPE_ORDER = ["EV", "ES", "TO", "DT", "WL", "VO", "NU", "LO"];
const TYPE_LABEL = {
  EV: "엘리베이터",
  ES: "에스컬레이터",
  TO: "화장실",
  DT: "장애인 화장실",
  WL: "휠체어 리프트",
  VO: "음성유도기",
  NU: "수유실",
  LO: "보관함",
};

export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const { stationName = "서울역", type = "EV", imageUrl = null } = route.params || {};

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [imageRatio, setImageRatio] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tempPoints, setTempPoints] = useState([]);

  // 팬/줌 상태
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const baseScale = useRef(1);
  const initialDistance = useRef(null);
  const panOffset = useRef({ x: 0, y: 0 }).current;

  // 파일 경로
  const coordsFilePath = `${FileSystem.documentDirectory}${stationName}_coords.json`;
  const trashFilePath = `${FileSystem.documentDirectory}Trash.json`;
  const mergedPath = `${FileSystem.documentDirectory}coords.json`;

  // ===== 이미지 비율/여백 보정 =====
  useEffect(() => {
    if (!imageUrl) return;
    Image.getSize(
      imageUrl,
      (w, h) => setImageRatio(w / h),
      () => setImageRatio(1)
    );
  }, [imageUrl]);

  useEffect(() => {
    const containerRatio = imgLayout.width / imgLayout.height;
    let offsetX = 0;
    let offsetY = 0;
    if (imageRatio > containerRatio) {
      // 좌우가 꽉 차고 상하 레터박스
      const scaledH = imgLayout.width / imageRatio;
      offsetY = (imgLayout.height - scaledH) / 2;
    } else {
      // 상하가 꽉 차고 좌우 레터박스
      const scaledW = imgLayout.height * imageRatio;
      offsetX = (imgLayout.width - scaledW) / 2;
    }
    setOffset({ x: offsetX, y: offsetY });
  }, [imgLayout, imageRatio]);

  // ===== 역별 좌표 로드 =====
  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(coordsFilePath);
        if (!info.exists) return;
        const content = await FileSystem.readAsStringAsync(coordsFilePath);
        const data = JSON.parse(content || "[]");
        setTempPoints(data.filter((p) => p.type === type));
      } catch (e) {
        console.error("🚨 loadCoords error:", e);
      }
    })();
  }, [coordsFilePath, type]);

  // ===== 저장 =====
  const saveCoordinate = async (origX, origY) => {
    const newCoord = {
      station: stationName,
      type,
      x: origX,
      y: origY,
      timestamp: new Date().toISOString(),
    };
    try {
      const info = await FileSystem.getInfoAsync(coordsFilePath);
      let data = [];
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(coordsFilePath);
        data = JSON.parse(content || "[]");
      }
      data.push(newCoord);
      await FileSystem.writeAsStringAsync(coordsFilePath, JSON.stringify(data, null, 2));
      setTempPoints((prev) => [...prev, newCoord]);
      console.log(`✅ ${stationName} ${type} 좌표 저장 완료`);
    } catch (e) {
      console.error("🚨 File write error:", e);
      Alert.alert("오류", "좌표 저장 중 문제가 발생했습니다.");
    }
  };

  // ===== 삭제 전 백업 =====
  const backupData = async (deletedData) => {
    try {
      const info = await FileSystem.getInfoAsync(trashFilePath);
      let trash = [];
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(trashFilePath);
        trash = JSON.parse(content || "[]");
      }
      trash.push(...deletedData);
      await FileSystem.writeAsStringAsync(trashFilePath, JSON.stringify(trash, null, 2));
      console.log(`🗄️ 백업 완료 (${deletedData.length}건)`);
    } catch (e) {
      console.error("🚨 백업 실패:", e);
    }
  };

  // ===== 안전 삭제 =====
  const clearCoordsSafely = async () => {
    try {
      const info = await FileSystem.getInfoAsync(coordsFilePath);
      if (!info.exists) return Alert.alert("삭제할 좌표가 없습니다.");

      const content = await FileSystem.readAsStringAsync(coordsFilePath);
      const data = JSON.parse(content || "[]");
      const sameType = data.filter((d) => d.type === type);

      Alert.alert(
        "삭제 옵션 선택",
        `${stationName}의 ${type} 좌표 ${sameType.length}건이 있습니다.`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "이 타입만 삭제",
            onPress: async () => {
              await backupData(sameType);
              const filtered = data.filter((d) => d.type !== type);
              await FileSystem.writeAsStringAsync(coordsFilePath, JSON.stringify(filtered, null, 2));
              setTempPoints([]);
              Alert.alert("완료", `${type} 좌표 ${sameType.length}건 삭제 완료`);
            },
          },
          {
            text: "이 역 전체 삭제",
            onPress: async () => {
              await backupData(data);
              await FileSystem.deleteAsync(coordsFilePath);
              setTempPoints([]);
              Alert.alert("완료", `${stationName}의 모든 좌표가 삭제되었습니다.`);
            },
          },
        ]
      );
    } catch (e) {
      console.error("🚨 삭제 오류:", e);
      Alert.alert("오류", "좌표 삭제 중 문제가 발생했습니다.");
    }
  };

  // ===== 좌표 파일 목록(역별 json) 요약 =====
  const showAllCoords = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const coordFiles = files.filter((f) => f.endsWith("_coords.json"));
      if (coordFiles.length === 0) return Alert.alert("📂 파일 없음", "저장된 좌표 파일이 없습니다.");

      let message = "";
      for (const f of coordFiles) {
        const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory + f);
        const sizeKB = Math.max(1, Math.round((info.size || 0) / 1024));
        const content = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + f);
        const data = JSON.parse(content || "[]");
        message += `📄 ${f}\n └ 좌표 ${data.length}개 (${sizeKB}KB)\n\n`;
      }
      Alert.alert("📂 좌표 파일 목록", message.trim());
    } catch (e) {
      console.error("🚨 파일 읽기 오류:", e);
      Alert.alert("오류", "파일 목록 불러오기 실패");
    }
  };

  // ===== 모든 역 파일 병합 → coords.json =====
  const mergeAllCoords = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
    const coordFiles = files.filter((f) => f.endsWith("_coords.json"));
      if (coordFiles.length === 0) return Alert.alert("병합 실패", "병합할 좌표 파일이 없습니다.");

      let merged = [];
      for (const f of coordFiles) {
        const content = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + f);
        const data = JSON.parse(content || "[]");
        merged.push(...data);
      }
      const unique = Array.from(
        new Map(merged.map((p) => [`${p.station}_${p.type}_${p.x}_${p.y}`, p])).values()
      );

      await FileSystem.writeAsStringAsync(mergedPath, JSON.stringify(unique, null, 2));
      console.log(`🔁 좌표 병합 완료 (${unique.length}건) → ${mergedPath}`);
      Alert.alert("병합 완료", `coords.json에 ${unique.length}개 저장됨`);
    } catch (e) {
      console.error("🚨 병합 오류:", e);
      Alert.alert("오류", "좌표 병합 실패");
    }
  };

  // ====== 좌표 뷰어(모달) ======
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerData, setViewerData] = useState([]);
  const [onlyCurrent, setOnlyCurrent] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const openCoordsViewer = async () => {
    try {
      const info = await FileSystem.getInfoAsync(mergedPath);
      if (!info.exists) {
        Alert.alert(
          "coords.json 없음",
          "먼저 '🔁 좌표 병합'을 눌러 전체 병합 파일을 만들어 주세요."
        );
        return;
      }
      const content = await FileSystem.readAsStringAsync(mergedPath);
      const arr = JSON.parse(content || "[]");
      // 정렬: 역 → 타입 순
      arr.sort(
        (a, b) =>
          (a.station || "").localeCompare(b.station || "") ||
          (a.type || "").localeCompare(b.type || "")
      );
      setViewerData(arr);
      setViewerVisible(true);
    } catch (e) {
      console.error("🚨 coords.json 읽기 오류:", e);
      Alert.alert("오류", "coords.json 읽기 실패");
    }
  };

  const filteredList = useMemo(() => {
    return viewerData.filter((p) => {
      if (onlyCurrent && p.station !== stationName) return false;
      if (typeFilter !== "ALL" && p.type !== typeFilter) return false;
      return true;
    });
  }, [viewerData, onlyCurrent, typeFilter, stationName]);

  // 🔁 필터 결과를 "콘솔"로 출력 (공유/파일 저장 없음, 복붙용)
  const exportFiltered = async () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        station: onlyCurrent ? stationName : "ALL",
        type: typeFilter,
        count: filteredList.length,
        items: filteredList, // [{ station, type, x, y, timestamp }, ...]
      };

      const json = JSON.stringify(payload, null, 2);

      // 길이 긴 로그가 잘리는 걸 방지하기 위해 청크로 나눠 출력
      const CHUNK = 8000;
      if (json.length > CHUNK) {
        console.log("==== coords_export START ====");
        for (let i = 0; i < json.length; i += CHUNK) {
          console.log(json.slice(i, i + CHUNK));
        }
        console.log("==== coords_export END ====");
      } else {
        console.log("==== coords_export ====");
        console.log(json);
      }

      // 선택: 한 줄씩 CSV로도 함께 출력 (복붙 편의)
      console.log("==== coords_export_csv ====");
      console.log("station,type,x,y,timestamp");
      filteredList.forEach((p) => {
        console.log(`${p.station},${p.type},${p.x},${p.y},${p.timestamp || ""}`);
      });

      Alert.alert(
        "콘솔로 내보냈습니다",
        "개발자 콘솔(터미널/Logs)에서 'coords_export'를 검색해 복사하세요."
      );
    } catch (e) {
      console.error("🚨 콘솔 내보내기 오류:", e);
      Alert.alert("오류", "콘솔 내보내기 실패");
    }
  };

  // ===== 터치 → 좌표 저장 =====
  const handleTouch = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const currentScale = baseScale.current;
    const currentPan = panOffset;

    // Animated 변환(팬/줌)과 레터박스 오프셋을 역변환
    const unPannedX = (locationX - currentPan.x - offset.x) / currentScale;
    const unPannedY = (locationY - currentPan.y - offset.y) / currentScale;

    // 컨테이너 내부로 클램프
    const validX = Math.max(0, Math.min(unPannedX, imgLayout.width));
    const validY = Math.max(0, Math.min(unPannedY, imgLayout.height));

    // 화면좌표 → 원본좌표 (contain 스케일 기반)
    const origX = Math.round((validX / imgLayout.width) * IMG_ORIGINAL_WIDTH);
    const origY = Math.round((validY / imgLayout.height) * IMG_ORIGINAL_HEIGHT);

    Alert.alert(
      "좌표 확인",
      `${stationName}\n${type} 좌표 저장?\n(${origX}, ${origY})`,
      [
        { text: "취소", style: "cancel" },
        { text: "저장", onPress: () => saveCoordinate(origX, origY) },
      ]
    );
  };

  // ===== 팬/줌 =====
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(panOffset);
        pan.setValue({ x: 0, y: 0 });
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { touches } = evt.nativeEvent;
        if (touches.length === 2) return true;
        if (touches.length === 1 && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5))
          return true;
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        const t = evt.nativeEvent.touches;
        if (t.length === 2) {
          const dx = t[0].pageX - t[1].pageX;
          const dy = t[0].pageY - t[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (initialDistance.current == null) {
            initialDistance.current = dist;
            baseScale.current = scale.__getValue();
          } else {
            const newScale = (dist / initialDistance.current) * baseScale.current;
            Animated.spring(scale, {
              toValue: Math.min(Math.max(newScale, 1), 3.5),
              useNativeDriver: false,
            }).start();
          }
        } else if (t.length === 1 && !initialDistance.current) {
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(
            evt,
            gestureState
          );
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
        pan.flattenOffset();
        const newPan = pan.__getValue();
        panOffset.x = newPan.x;
        panOffset.y = newPan.y;

        const s = scale.__getValue();
        if (s < 1) {
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
          baseScale.current = 1;
        } else baseScale.current = s;
      },
    })
  ).current;

  if (!imageUrl)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#14CAC9" size="large" />
        <Text>지도를 불러오는 중...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {stationName} ({type}) 좌표 수집
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btnDanger} onPress={clearCoordsSafely}>
          <Text style={styles.buttonText}>⚠️ 좌표 삭제</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#14CAC9" }]} onPress={showAllCoords}>
          <Text style={styles.buttonText}>📂 좌표 파일 목록</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#10B981" }]} onPress={mergeAllCoords}>
          <Text style={styles.buttonText}>🔁 좌표 병합</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#3878FF" }]} onPress={openCoordsViewer}>
          <Text style={styles.buttonText}>👀 좌표 뷰어 열기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <TouchableWithoutFeedback onPress={handleTouch}>
          <Animated.View
            style={[styles.imageWrapper, { transform: [...pan.getTranslateTransform(), { scale }] }]}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onLayout={(e) => setImgLayout(e.nativeEvent.layout)}
            />
            {/* SVG 오버레이: 컨테이너 기준(width/height), 점은 레터박스 offset 더해서 배치 */}
            <Svg style={[styles.overlay, { width: imgLayout.width, height: imgLayout.height }]}>
              {tempPoints.map((p, i) => (
                <Circle
                  key={`${p.station}_${p.type}_${p.x}_${p.y}_${i}`}
                  cx={(p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width + offset.x}
                  cy={(p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height + offset.y}
                  r={9}
                  fill="#14CAC9"
                  stroke="#000"
                  strokeWidth={1.5}
                />
              ))}
            </Svg>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>

      {/* ===== 좌표 뷰어 모달 ===== */}
      <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.modalWrap}>
          <Text style={styles.modalTitle}>coords.json 전체 좌표</Text>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.chip, onlyCurrent ? styles.chipActive : null]}
              onPress={() => setOnlyCurrent(true)}
            >
              <Text style={[styles.chipText, onlyCurrent && styles.chipTextActive]}>현재역만</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !onlyCurrent ? styles.chipActive : null]}
              onPress={() => setOnlyCurrent(false)}
            >
              <Text style={[styles.chipText, !onlyCurrent && styles.chipTextActive]}>전체</Text>
            </TouchableOpacity>

            {["ALL", ...TYPE_ORDER].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, typeFilter === t && styles.chipActive]}
                onPress={() => setTypeFilter(t)}
              >
                <Text style={[styles.chipText, typeFilter === t && styles.chipTextActive]}>
                  {t === "ALL" ? "ALL" : TYPE_LABEL[t] || t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.countText}>
            표시: {filteredList.length} / 전체 {viewerData.length}
            {onlyCurrent ? `  (역: ${stationName})` : ""}
            {typeFilter !== "ALL" ? `, 타입: ${TYPE_LABEL[typeFilter] || typeFilter}` : ""}
          </Text>

          <FlatList
            data={filteredList}
            keyExtractor={(item, idx) => `${item.station}_${item.type}_${item.x}_${item.y}_${idx}`}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {item.station} · {TYPE_LABEL[item.type] || item.type}
                </Text>
                <Text style={styles.cardText}>
                  좌표: ({item.x}, {item.y})
                </Text>
                {item.timestamp ? <Text style={styles.cardSub}>{item.timestamp}</Text> : null}
              </View>
            )}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: "#6366F1" }]} onPress={exportFiltered}>
              <Text style={styles.buttonText}>🖨 콘솔로 내보내기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#9CA3AF" }]}
              onPress={() => setViewerVisible(false)}
            >
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginTop: 10 },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    marginVertical: 10,
  },
  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  btnDanger: { backgroundColor: "#ff6666", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "600" },

  imageContainer: { width: screenW, height: screenH * 0.6, overflow: "hidden", backgroundColor: "#f0f0f0" },
  imageWrapper: { width: "100%", height: "100%", position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, left: 0 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // modal
  modalWrap: { flex: 1, backgroundColor: "#ffffff" },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", paddingVertical: 12 },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    justifyContent: "center",
  },
  chip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  chipActive: { backgroundColor: "#14CAC9", borderColor: "#14CAC9" },
  chipText: { color: "#111827", fontWeight: "600" },
  chipTextActive: { color: "#ffffff" },
  countText: { textAlign: "center", color: "#6B7280", marginBottom: 6 },

  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: { fontWeight: "800", marginBottom: 4, color: "#111827" },
  cardText: { color: "#374151", marginBottom: 2 },
  cardSub: { color: "#6B7280", fontSize: 12 },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});
