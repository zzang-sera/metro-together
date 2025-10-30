import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image as RNImage } from "react-native";
import Svg, { Image as SvgImage, Circle, Text as SvgText } from "react-native-svg";
import stationCoords from "../assets/metro-data/metro/station/station_coords.json";

const { width: screenW } = Dimensions.get("window");

export default function BarrierFreeMapMini({ stationName, imageUrl, height = 260 }) {
  const [coords, setCoords] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1000, height: 1000 });

  const normalizeName = (name) =>
    String(name || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();

  useEffect(() => {
    const cleanName = normalizeName(stationName);
    const toilets = Array.isArray(stationCoords)
      ? stationCoords.filter(
          (item) =>
            normalizeName(item.station) === cleanName && String(item.type).toUpperCase() === "TO"
        )
      : [];
    setCoords(toilets);
  }, [stationName]);

  // ✅ 실제 이미지 크기 읽기
  useEffect(() => {
    if (imageUrl) {
      RNImage.getSize(
        imageUrl,
        (width, height) => setImgSize({ width, height }),
        () => setImgSize({ width: 1000, height: 1000 })
      );
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>이미지를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const aspectRatio = imgSize.width / imgSize.height;
  const displayWidth = screenW * 0.85;
  const displayHeight = height;

  return (
    <View
      style={[
        styles.container,
        { width: displayWidth, height: displayHeight, aspectRatio },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
        preserveAspectRatio="xMidYMid slice" // ✅ 이미지 과대확대 방지
      >
        <SvgImage
          href={{ uri: imageUrl }}
          width={imgSize.width}
          height={imgSize.height}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* 화장실 마커 */}
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
              화장실
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <Text style={styles.caption}>{stationName}역 화장실 위치</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  caption: {
    textAlign: "center",
    paddingVertical: 6,
    fontWeight: "700",
    color: "#17171B",
  },
  errorBox: {
    width: screenW * 0.85,
    alignSelf: "center",
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  errorText: {
    textAlign: "center",
    color: "#999",
    fontWeight: "600",
  },
});
