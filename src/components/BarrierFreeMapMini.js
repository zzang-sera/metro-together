// ✅ src/components/BarrierFreeMapMini.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import stationCoords from "../assets/metro-data/metro/station/station_coords.json";

const { width: screenW, height: screenH } = Dimensions.get("window");
const MAX_CARD_HEIGHT = Math.min(260, screenH * 0.45);

export default function BarrierFreeMapMini({ stationName, imageUrl, type = "TO" }) {
  const [coords, setCoords] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1000, height: 1000 });
  const [validImage, setValidImage] = useState(false);
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

  const fallbackBubbleW = Math.round(screenW * 0.72);
  const cardW = Math.max(140, Math.min(parentW || fallbackBubbleW, screenW * 0.85));
  const aspect = imgSize.width / imgSize.height || 1;
  const naturalH = cardW / aspect;
  const cardH = Math.min(naturalH, MAX_CARD_HEIGHT);

  if (!validImage) {
    return (
      <View style={styles.errorBox} onLayout={(e) => setParentW(e.nativeEvent.layout.width)}>
        <Text style={styles.errorText}>🗺 {stationName}역의 지도 이미지를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { width: cardW }]} onLayout={(e) => setParentW(e.nativeEvent.layout.width)}>
      <View style={[styles.imageBox, { height: cardH }]}>
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="contain" />
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
      <Text style={styles.caption}>{stationName}역 {TYPE_LABEL[type] || "시설"} 위치</Text>
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
