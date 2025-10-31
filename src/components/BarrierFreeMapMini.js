// ✅ src/components/BarrierFreeMapMini.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import stationCoords from "../assets/metro-data/metro/station/station_coords.json";

const { width: screenW, height: screenH } = Dimensions.get("window");

// 말풍선 내부에서 과하게 커지지 않도록 최대 높이(필요시 더 줄여도 됨)
const MAX_CARD_HEIGHT = Math.min(260, screenH * 0.45);

export default function BarrierFreeMapMini({
  stationName,
  imageUrl,
  type = "TO",
}) {
  const [coords, setCoords] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1000, height: 1000 });
  const [validImage, setValidImage] = useState(false);
  const [parentW, setParentW] = useState(null); // ✅ 말풍선 실제 너비 측정

  const normalizeName = (name) =>
    String(name || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();

  const TYPE_LABEL = {
    TO: "화장실",
    DT: "장애인 화장실",
    WL: "휠체어리프트",
    NU: "수유실",
    LO: "보관함",
  };

  // ✅ 좌표 필터
  useEffect(() => {
    const clean = normalizeName(stationName);
    const filtered = Array.isArray(stationCoords)
      ? stationCoords.filter(
          (p) =>
            normalizeName(p.station) === clean &&
            String(p.type).toUpperCase() === type.toUpperCase()
        )
      : [];
    setCoords(filtered);
  }, [stationName, type]);

  // ✅ 이미지 유효성 및 원본 크기
  useEffect(() => {
    if (
      imageUrl &&
      typeof imageUrl === "string" &&
      (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    ) {
      Image.getSize(
        imageUrl,
        (w, h) => {
          setImgSize({ width: w, height: h });
          setValidImage(true);
        },
        () => setValidImage(false)
      );
    } else {
      setValidImage(false);
    }
  }, [imageUrl]);

  // ✅ 부모 너비가 아직 없으면, 우선 말풍선 예상치(스크린의 72%)로 잡았다가 onLayout에서 재계산
  const fallbackBubbleW = Math.round(screenW * 0.72);
  const cardW = Math.max(140, Math.min(parentW || fallbackBubbleW, screenW * 0.85));
  const aspect = imgSize.width / imgSize.height || 1;
  const naturalH = cardW / aspect;
  const cardH = Math.min(naturalH, MAX_CARD_HEIGHT); // ⛔️ 높이 캡으로 넘침 방지

  if (!validImage) {
    return (
      <View
        style={styles.errorBox}
        onLayout={(e) => setParentW(e.nativeEvent.layout.width)}
      >
        <Text style={styles.errorText}>
          🗺 {stationName}역의 지도 이미지를 불러올 수 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.card, { width: cardW }]}
      onLayout={(e) => setParentW(e.nativeEvent.layout.width)} // ✅ 말풍선 실제 너비 반영
    >
      {/* 배경 지도 이미지: contain + 절대 위치 (크래시 방지) */}
      <View style={[styles.imageBox, { height: cardH }]}>
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
        {/* 마커 오버레이: 원본 좌표계를 유지하기 위해 viewBox 사용 */}
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {coords.map((p, idx) => (
            <React.Fragment key={`${p.station}_${p.x}_${p.y}_${idx}`}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={imgSize.width / 60}
                fill="#14CAC9"
                stroke="#fff"
                strokeWidth={imgSize.width / 300}
              />
              <SvgText
                x={p.x + imgSize.width / 80}
                y={p.y + imgSize.height / 100}
                fontSize={imgSize.width / 60}
                fill="#17171B"
                fontWeight="bold"
              >
                {TYPE_LABEL[type] || "시설"}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>

      <Text style={styles.caption}>
        {stationName}역 {TYPE_LABEL[type] || "시설"} 위치
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "flex-start", // ✅ 말풍선 폭을 넘지 않게 (bubble는 보통 left-aligned)
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imageBox: {
    width: "100%",
    backgroundColor: "#fff",
  },
  caption: {
    textAlign: "center",
    paddingVertical: 6,
    fontWeight: "700",
    color: "#17171B",
  },
  errorBox: {
    alignSelf: "flex-start",
    maxWidth: screenW * 0.8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  errorText: {
    textAlign: "left",
    color: "#666",
    fontWeight: "600",
  },
});
