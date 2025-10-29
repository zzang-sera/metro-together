// src/screens/station/BarrierFreeMapScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Svg, { Rect, Path, G, Image as SvgImage } from "react-native-svg";
import * as FileSystem from "expo-file-system";

import elevatorData from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";
import escalatorData from "../../assets/metro-data/metro/escalator/서울교통공사_에스컬레이터 설치 정보_20250310.json";
import toiletData from "../../assets/metro-data/metro/toilets/서울교통공사_역사공중화장실정보_20241127.json";
import disabledToiletData from "../../assets/metro-data/metro/disabled_toilets/서울교통공사_역사장애인화장실정보_20241127.json";
import babyRoomData from "../../assets/metro-data/metro/babyroom/서울교통공사_수유실현황_20250924.json";
import lockerData from "../../assets/metro-data/metro/lostandFound/서울교통공사_물품보관함 위치정보_20240930.json";
import liftData from "../../assets/metro-data/metro/wheelchairLift/서울교통공사_휠체어리프트 설치현황_20250310.json";

const { width: screenW, height: screenH } = Dimensions.get("window");
const IMG_ORIGINAL_WIDTH = 3376;   // 절대 수정 금지
const IMG_ORIGINAL_HEIGHT = 3375;  // 절대 수정 금지

const ICONS = {
  EV: require("../../assets/function-icon/Elevator_for_all.png"),
  ES: require("../../assets/function-icon/Escalator.png"),
  TO: require("../../assets/function-icon/Bathromm_for_all.png"),
  DT: require("../../assets/function-icon/Disablities_bathroom.png"),
  WL: require("../../assets/function-icon/Lift.png"),
  VO: require("../../assets/function-icon/Seats_for_patients.png"),
  NU: require("../../assets/function-icon/Baby.png"),
  LO: require("../../assets/function-icon/Lost and Found.png"),
};

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

const BUBBLE_WIDTH = 15;
const BUBBLE_HEIGHT = 15;
const BUBBLE_RADIUS = 3;
const TAIL_HEIGHT = 3;
const ICON_SIZE = 10;

function BubbleMarker({ cx, cy, type }) {
  const halfW = BUBBLE_WIDTH / 2;
  const rectY = -BUBBLE_HEIGHT - TAIL_HEIGHT;
  const iconX = -ICON_SIZE / 2;
  const iconY = rectY + (BUBBLE_HEIGHT - ICON_SIZE) / 2;
  const tailPath = `M 0 0 L -6 ${-TAIL_HEIGHT} L 6 ${-TAIL_HEIGHT} Z`;
  const iconSrc = ICONS[type] || ICONS["EV"];
  return (
    <G x={cx} y={cy}>
      <Rect
        x={-halfW}
        y={rectY}
        width={BUBBLE_WIDTH}
        height={BUBBLE_HEIGHT}
        rx={BUBBLE_RADIUS}
        ry={BUBBLE_RADIUS}
        fill="#fff"
        stroke="#fff"
        strokeWidth={1.5}
      />
      <Path d={tailPath} fill="#fff" stroke="#fff" strokeWidth={1.5} />
      <SvgImage href={iconSrc} x={iconX} y={iconY} width={ICON_SIZE} height={ICON_SIZE} />
    </G>
  );
}

export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const { stationName = "서울역", type = "EV", imageUrl = null } = route.params || {};

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // ← contain 오프셋만 계산해서 넣음
  const [tempPoints, setTempPoints] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const coordsFilePath = `${FileSystem.documentDirectory}${stationName}_coords.json`;

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

  useEffect(() => {
    let data = [];
    switch (type) {
      case "EV":
        data = elevatorData.DATA.filter((d) => d.stn_nm.includes(stationName));
        break;
      case "ES":
        data = escalatorData.filter((d) => d["역  명"].includes(stationName));
        break;
      case "TO":
        data = toiletData.filter((d) => d.역명.includes(stationName));
        break;
      case "DT":
        data = disabledToiletData.filter((d) => d.역명.includes(stationName));
        break;
      case "NU":
        data = babyRoomData.filter((d) => d.역명.includes(stationName));
        break;
      case "WL":
        data = liftData.filter((d) => d.역명.includes(stationName));
        break;
      case "LO":
        data = lockerData.filter((d) => String(d["상세위치"]).includes(stationName));
        break;
      default:
        data = [];
    }
    setFacilities(data);
  }, [stationName, type]);

  // 팬/줌 (그대로)
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const baseScale = useRef(1);
  const initialDistance = useRef(null);
  const panOffset = useRef({ x: 0, y: 0 }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(panOffset);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
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
        } else if (touches.length === 1) {
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(
            evt,
            gestureState
          );
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
        pan.flattenOffset();
        const maxX = (screenW * (scale.__getValue() - 1)) / 2;
        const maxY = (screenH * (scale.__getValue() - 1)) / 2;
        const newPan = pan.__getValue();
        const clampedX = Math.max(-maxX, Math.min(newPan.x, maxX));
        const clampedY = Math.max(-maxY, Math.min(newPan.y, maxY));
        panOffset.x = clampedX;
        panOffset.y = clampedY;
        pan.setValue({ x: clampedX, y: clampedY });
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{stationName} 무장애 지도</Text>

      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.mapWrapper,
            { transform: [...pan.getTranslateTransform(), { scale }] },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setImgLayout({ width, height });

              // ★★★ contain 오프셋 재계산(이미지 비율은 원본 고정값 사용) ★★★
              const imageAspect = IMG_ORIGINAL_WIDTH / IMG_ORIGINAL_HEIGHT; // ≈ 1.0003
              const viewAspect = width / height;                            // 예: 360/423 ≈ 0.851

              let offsetX = 0, offsetY = 0, drawW, drawH;
              if (imageAspect > viewAspect) {
                // 좌우가 먼저 맞춰져서 상하에 레터박스
                drawW = width;
                drawH = width / imageAspect;
                offsetY = (height - drawH) / 2;
              } else {
                // 상하가 먼저 맞춰져서 좌우에 레터박스
                drawH = height;
                drawW = height * imageAspect;
                offsetX = (width - drawW) / 2;
              }
              setOffset({ x: offsetX, y: offsetY });

              // 디버그 로그
              console.log("🧭 렌더링된 이미지 크기:", width, height);
              console.log("📐 aspect img/view:", imageAspect.toFixed(4), viewAspect.toFixed(4));
              console.log("🎯 contain offset:", offsetX.toFixed(2), offsetY.toFixed(2));
            }}
          />

          <Svg style={[styles.overlay, { width: imgLayout.width, height: imgLayout.height }]}>
            {tempPoints.map((p, i) => {
              // ✅ 좌표 공식은 그대로 (검증 완료)
              const cx = (p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width + offset.x;
              const cy = (p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height + offset.y;

              // (옵션) 필요시 로그
              // console.log(`pt(${p.x},${p.y}) -> (${cx.toFixed(2)},${cy.toFixed(2)}) offset=(${offset.x.toFixed(2)},${offset.y.toFixed(2)})`);

              return (
                <BubbleMarker
                  key={`${p.station}_${p.type}_${p.x}_${p.y}_${i}`}
                  cx={cx}
                  cy={cy}
                  type={p.type}
                />
              );
            })}
          </Svg>
        </Animated.View>
      </View>

      {/* 하단 리스트 */}
      <View style={styles.listContainer}>
        {facilities.length === 0 ? (
          <Text style={styles.empty}>해당 시설 정보가 없습니다.</Text>
        ) : (
          facilities.map((item, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.facilityTitle}>{TYPE_LABEL[type]}</Text>
              <Text style={styles.facilityDesc}>{extractDetail(item, type)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function extractDetail(item, type) {
  switch (type) {
    case "EV":
      return `${item.instl_pstn || ""} (${item.use_yn || ""})`;
    case "ES":
      return `${item["시작층(상세위치)"] || ""} ↔ ${item["종료층(상세위치)"] || ""}`;
    case "TO":
    case "DT":
      return item["상세위치"] || "";
    case "WL":
      return `${item["시작층(상세위치)"]} ↔ ${item["종료층(상세위치)"]}`;
    case "NU":
      return item["상세위치"] || "";
    case "LO":
      return item["상세위치"] || "";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginTop: 10 },
  imageContainer: { width: screenW, height: screenH * 0.6, overflow: "hidden" },
  mapWrapper: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: { position: "absolute", top: 0, left: 0 },
  listContainer: { padding: 12, backgroundColor: "#f8f8f8" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 8,
  },
  facilityTitle: { fontWeight: "600", fontSize: 15, color: "#222" },
  facilityDesc: { fontSize: 13, color: "#555", marginTop: 2 },
  empty: { textAlign: "center", color: "#666", marginTop: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
