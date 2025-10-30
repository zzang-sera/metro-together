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

import stationCoords from "../../assets/metro-data/metro/station/station_coords.json";
import { useApiFacilities } from "../../hook/useApiFacilities";
import { useLocalFacilities } from "../../hook/useLocalFacilities";

const { width: screenW, height: screenH } = Dimensions.get("window");
const IMG_ORIGINAL_WIDTH = 3376;
const IMG_ORIGINAL_HEIGHT = 3375;

// ✅ 아이콘
const ICONS = {
  EV: require("../../assets/function-icon/Elevator_for_all.png"),
  ES: require("../../assets/function-icon/Escalator.png"),
  TO: require("../../assets/function-icon/Bathromm_for_all.png"),
  DT: require("../../assets/function-icon/Disablities_bathroom.png"),
  WL: require("../../assets/function-icon/Lift.png"),
  VO: require("../../assets/function-icon/Seats_for_patients.png"),
  NU: require("../../assets/function-icon/Baby.png"),
  LO: require("../../assets/function-icon/Lost and Found.png"),
  // WC 아이콘은 파트너가 추가 예정
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
  WC: "휠체어 급속 충전",
};

function BubbleMarker({ cx, cy, type }) {
  const BUBBLE_WIDTH = 10;
  const BUBBLE_HEIGHT = 10;
  const BUBBLE_RADIUS = 2;
  const TAIL_HEIGHT = 2;
  const ICON_SIZE = 9;
  const iconSrc = ICONS[type] || ICONS["EV"];
  const halfW = BUBBLE_WIDTH / 2;
  const rectY = -BUBBLE_HEIGHT - TAIL_HEIGHT;
  const iconX = -ICON_SIZE / 2;
  const iconY = rectY + (BUBBLE_HEIGHT - ICON_SIZE) / 2;
  const tailPath = `M 0 0 L -6 ${-TAIL_HEIGHT} L 6 ${-TAIL_HEIGHT} Z`;

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
  const { stationName = "서울역", stationCode = "", type = "EV", imageUrl = null } =
    route.params || {};

  // ✅ 역 이름 정제
  const cleanName = (() => {
    if (!stationName) return "";
    let name = stationName.replace(/\(.*\)/g, "").trim();
    if (name === "서울") return "서울역"; // 예외 처리
    name = name.replace(/역$/, ""); // “노원역” → “노원”
    return name;
  })();

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [coords, setCoords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ API / Local 훅
  const api = useApiFacilities(cleanName, stationCode, null, type);
  const local = useLocalFacilities(cleanName, stationCode, null, type);

  // ✅ 좌표 로드
  useEffect(() => {
    if (type === "WC") {
      setCoords([]);
      return;
    }
    try {
      const filtered = stationCoords.filter(
        (p) =>
          p.station.replace(/\(.*\)/g, "").trim() === cleanName &&
          p.type.toUpperCase() === type.toUpperCase()
      );
      setCoords(filtered);
      console.log(`📍 ${cleanName} ${type} 좌표 ${filtered.length}개 로드됨`);
    } catch (e) {
      console.error("🚨 좌표 로드 오류:", e);
    }
  }, [cleanName, type]);

  // ✅ API → 로컬 fallback 로직
  useEffect(() => {
    const apiSupported = ["EV", "ES", "TO", "DT", "WC"].includes(type);

    if (apiSupported) {
      if (!api.loading && api.data.length > 0) {
        setFacilities(api.data);
        setLoading(false);
      } else if (!api.loading && api.data.length === 0 && !local.loading) {
        if (local.data.length > 0) {
          console.log(`🌀 [Fallback] ${type} API 비어있음 → 로컬 JSON 사용`);
          setFacilities(local.data);
        } else {
          console.log(`🚫 [Fallback] ${type} 로컬도 비어 있음`);
          setFacilities([]);
        }
        setLoading(false);
      } else if (!api.loading && api.error && !local.loading) {
        setFacilities(local.data || []);
        setLoading(false);
      }
    } else {
      if (!local.loading) {
        setFacilities(local.data);
        setLoading(false);
      }
    }
  }, [
    type,
    api.data,
    api.loading,
    api.error,
    local.data,
    local.loading,
    local.error,
  ]);

  // ✅ 팬/줌 기능
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
      <Text style={styles.title}>{cleanName} 무장애 지도</Text>

      {type !== "WC" && (
        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[styles.mapWrapper, { transform: [...pan.getTranslateTransform(), { scale }] }]}
          >
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
            <Svg style={[styles.overlay, { width: imgLayout.width, height: imgLayout.height }]}>
              {coords.map((p, i) => (
                <BubbleMarker key={`${p.station}_${i}`} cx={p.x} cy={p.y} type={p.type} />
              ))}
            </Svg>
          </Animated.View>
        </View>
      )}

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#14CAC9" size="large" />
            <Text>시설 정보를 불러오는 중...</Text>
          </View>
        ) : facilities.length === 0 ? (
          <Text style={styles.empty}>해당 시설 정보가 없습니다.</Text>
        ) : (
          facilities.map((item, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.facilityTitle}>{TYPE_LABEL[type]}</Text>
              <Text style={styles.facilityDesc}>{item.desc || "위치 정보 없음"}</Text>
              {item.status ? <Text style={styles.facilityStatus}>{item.status}</Text> : null}
              {item.contact ? (
                <Text style={styles.facilityContact}>문의: {item.contact}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
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
  facilityStatus: { fontSize: 12, color: "#14CAC9", marginTop: 2 },
  facilityContact: { fontSize: 12, color: "#333", marginTop: 2 },
  empty: { textAlign: "center", color: "#666", marginTop: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
