// src/screens/station/CheongnyangniRouteScreen.js
import React from "react";
import { View, ImageBackground, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Polyline, Text as SvgText } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function CheongnyangniRouteScreen() {
  const baseWidth = 768;
  const scale = width / baseWidth;

  // 확대/이동 제어
  const scaleValue = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Pinch (줌)
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scaleValue.value = e.scale;
    })
    .onEnd(() => {
      if (scaleValue.value < 1) scaleValue.value = withTiming(1);
      else if (scaleValue.value > 3.5) scaleValue.value = withTiming(3.5);
    });

  // Pan (드래그)
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value += e.changeX;
      translateY.value += e.changeY;
    })
    .onEnd(() => {
      // 확대가 작을 때는 위치 리셋
      if (scaleValue.value <= 1.05) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  // 두 제스처를 병합 (동시에 동작)
  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleValue.value },
    ],
  }));

  // 좌표 데이터
  const exits = [
    { name: "출구 1", x: 109, y: 874 },
    { name: "출구 2", x: 454, y: 646 },
    { name: "출구 3", x: 510, y: 634 },
    { name: "출구 4", x: 602, y: 683 },
    { name: "출구 5", x: 460, y: 740 },
    { name: "출구 6", x: 183, y: 925 },
  ];
  const elevators = [
    { name: "엘리베이터 1", x: 242, y: 890 },
    { name: "엘리베이터 2", x: 425, y: 704 },
    { name: "엘리베이터 3", x: 437, y: 654 },
  ];
  const escalators = [{ name: "에스컬레이터 1", x: 205, y: 917 }];
  const toilets = [{ name: "화장실", x: 563, y: 715 }];
  const path = [
    { x: 425, y: 704 },
    { x: 563, y: 715 },
    { x: 602, y: 683 },
  ];

  const scaled = (p, z) => ({
    x: p.x * scale * z,
    y: p.y * scale * z,
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.zoomContainer, animatedStyle]}>
          <ImageBackground
            source={require("../../assets/124_cheongnyangni.jpg")}
            style={styles.map}
            resizeMode="contain"
          >
            <Svg height="100%" width="100%">
              {/* 🔴 출구 */}
              {exits.map((p, i) => {
                const pos = scaled(p, scaleValue.value);
                return (
                  <React.Fragment key={`exit-${i}`}>
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={5 * scaleValue.value}
                      fill="#ff3b30"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <SvgText
                      x={pos.x + 8}
                      y={pos.y + 4}
                      fill="#000"
                      fontSize={9 * scaleValue.value}
                      fontWeight="bold"
                    >
                      {p.name}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* 🟢 엘리베이터 */}
              {elevators.map((p, i) => {
                const pos = scaled(p, scaleValue.value);
                return (
                  <React.Fragment key={`elev-${i}`}>
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={5 * scaleValue.value}
                      fill="#34c759"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <SvgText
                      x={pos.x + 8}
                      y={pos.y + 4}
                      fill="#000"
                      fontSize={9 * scaleValue.value}
                      fontWeight="bold"
                    >
                      {p.name}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* 🔵 에스컬레이터 */}
              {escalators.map((p, i) => {
                const pos = scaled(p, scaleValue.value);
                return (
                  <React.Fragment key={`esca-${i}`}>
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={5 * scaleValue.value}
                      fill="#007aff"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <SvgText
                      x={pos.x + 8}
                      y={pos.y + 4}
                      fill="#000"
                      fontSize={9 * scaleValue.value}
                      fontWeight="bold"
                    >
                      {p.name}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* 🟣 화장실 */}
              {toilets.map((p, i) => {
                const pos = scaled(p, scaleValue.value);
                return (
                  <React.Fragment key={`toilet-${i}`}>
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={5 * scaleValue.value}
                      fill="#af52de"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <SvgText
                      x={pos.x + 8}
                      y={pos.y + 4}
                      fill="#000"
                      fontSize={9 * scaleValue.value}
                      fontWeight="bold"
                    >
                      {p.name}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* 🚶 경로선 */}
              <Polyline
                points={path
                  .map(
                    (p) =>
                      `${p.x * scale * scaleValue.value},${p.y * scale * scaleValue.value}`
                  )
                  .join(" ")}
                fill="none"
                stroke="#ffcc00"
                strokeWidth={3 * scaleValue.value}
                strokeDasharray="8,5"
                strokeLinecap="round"
              />
            </Svg>
          </ImageBackground>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  zoomContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  map: { flex: 1, width: width, height: height },
});
