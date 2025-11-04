// ✅ src/components/BarrierFreeMapMini.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image, ActivityIndicator } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import stationCoords from "../assets/metro-data/metro/station/station_coords.json";

const { width: screenW, height: screenH } = Dimensions.get("window");
const MAX_CARD_HEIGHT = Math.min(260, screenH * 0.45);

export default function BarrierFreeMapMini({ stationName, imageUrl, type = "TO" }) {
  const [coords, setCoords] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 }); // 초기값 1:1 대신, 즉시 계산용
  const [hasRealSize, setHasRealSize] = useState(false);
  const [parentW, setParentW] = useState(null);

  const normalizeName = (name) =>
    String(name || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();

  const TYPE_LABEL = {
    TO: "화장실",
    DT: "장애인 화장실",
    WL: "휠체어리프트",
    NU: "수유실",
    LO: "보관함",
  };

  // ✅ 이미지 크기 불러오기
  useEffect(() => {
    if (typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) {
      setHasRealSize(false);
      return;
    }
    Image.getSize(
      imageUrl,
      (w, h) => {
        setImgSize({ width: w, height: h });
        setHasRealSize(true);
      },
      () => {
        setHasRealSize(false);
      }
    );
  }, [imageUrl]);

  // ✅ 카드 너비 계산
  const fallbackW = Math.round(screenW * 0.72);
  const cardW = Math.max(140, Math.min(parentW || fallbackW, screenW * 0.85));

  // ✅ 비율 계산 (실제 비율이 오기 전에는 임시 1.6 사용)
  const aspect = hasRealSize ? imgSize.width / imgSize.height : 1.6;
  const cardH = Math.min(cardW / aspect, MAX_CARD_HEIGHT);

  // ✅ 실제 이미지 비율이 오기 전에는 로딩 뷰 표시
  if (!hasRealSize) {
    return (
      <View
        style={styles.loadingBox}
        onLayout={(e) => setParentW(e.nativeEvent.layout.width)}
      >
        <ActivityIndicator size="small" color="#14CAC9" />
        <Text style={styles.loadingText}>{stationName}역 지도 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.card, { width: cardW, maxHeight: MAX_CARD_HEIGHT }]}
      onLayout={(e) => setParentW(e.nativeEvent.layout.width)}
      key={imageUrl} // 이미지 교체시 리렌더 유도
    >
      {/* 이미지 비율 고정 */}
      <View style={[styles.imageBox, { aspectRatio: aspect }]}>
        {/* 지도 이미지 */}
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
        {/* 마커 SVG */}
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

      {/* 캡션 */}
      <Text style={styles.caption}>
        {stationName} {TYPE_LABEL[type] || "시설"} 위치
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "flex-start",
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
    position: "relative",
  },
  caption: {
    textAlign: "center",
    paddingVertical: 6,
    fontWeight: "700",
    color: "#17171B",
  },
  loadingBox: {
    alignSelf: "flex-start",
    maxWidth: screenW * 0.8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#666",
    fontWeight: "600",
  },
});
