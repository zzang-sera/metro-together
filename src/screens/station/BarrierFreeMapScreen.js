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
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Path, G, Image as SvgImage } from "react-native-svg";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";

import stationCoords from "../../assets/metro-data/metro/station/station_coords.json";
import elevatorData from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";
import escalatorData from "../../assets/metro-data/metro/escalator/서울교통공사_에스컬레이터 설치 정보_20250310.json";
import toiletData from "../../assets/metro-data/metro/toilets/서울교통공사_역사공중화장실정보_20241127.json";
import disabledToiletData from "../../assets/metro-data/metro/disabled_toilets/서울교통공사_역사장애인화장실정보_20241127.json";
import babyRoomData from "../../assets/metro-data/metro/babyroom/서울교통공사_수유실현황_20250924.json";
import lockerData from "../../assets/metro-data/metro/lostandFound/서울교통공사_물품보관함 위치정보_20240930.json";
import liftData from "../../assets/metro-data/metro/wheelchairLift/서울교통공사_휠체어리프트 설치현황_20250310.json";

const { width: screenW, height: screenH } = Dimensions.get("window");
const IMG_ORIGINAL_WIDTH = 3376;
const IMG_ORIGINAL_HEIGHT = 3375;

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

const BUBBLE_WIDTH = 10;
const BUBBLE_HEIGHT = 10;
const ICON_SIZE = 9;

function BubbleMarker({ cx, cy, type }) {
  const halfW = BUBBLE_WIDTH / 2;
  const rectY = -BUBBLE_HEIGHT - 2;
  const iconX = -ICON_SIZE / 2;
  const iconY = rectY + (BUBBLE_HEIGHT - ICON_SIZE) / 2;
  const tailPath = `M 0 0 L -6 -2 L 6 -2 Z`;
  const iconSrc = ICONS[type] || ICONS["EV"];

  return (
    <G x={cx} y={cy}>
      <Rect
        x={-halfW}
        y={rectY}
        width={BUBBLE_WIDTH}
        height={BUBBLE_HEIGHT}
        rx={2}
        ry={2}
        fill="#14CAC9"
        stroke="#14CAC9"
        strokeWidth={1}
      />
      <Path d={tailPath} fill="#14CAC9" stroke="#14CAC9" strokeWidth={1} />
      <SvgImage href={iconSrc} x={iconX} y={iconY} width={ICON_SIZE} height={ICON_SIZE} />
    </G>
  );
}

export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  let { stationName = "서울역", type = "EV", imageUrl = null } = route.params || {};

  // ✅ 이름 정규화 + “서울” 예외처리
  stationName = stationName.replace(/\(.*\)/g, "").trim();
  if (stationName === "서울역") stationName = "서울"; // ← 좌표 파일 내 이름 일치

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tempPoints, setTempPoints] = useState([]);
  const [facilities, setFacilities] = useState([]);

  // ✅ 좌표 로드
  useEffect(() => {
    try {
      const filtered = stationCoords.filter((p) => {
        const s = p.station.replace(/\s/g, "").replace(/\(.*\)/g, "").trim();
        const t = stationName.replace(/\s/g, "").replace(/\(.*\)/g, "").trim();
        const nameMatch = s.includes(t) || t.includes(s);
        const typeMatch = p.type && p.type.toUpperCase() === type.toUpperCase();
        return nameMatch && typeMatch;
      });
      setTempPoints(filtered);
    } catch (e) {
      console.error("🚨 station_coords load error:", e);
    }
  }, [stationName, type]);

  // ✅ 시설 데이터 로드
  useEffect(() => {
    let data = [];
    switch (type) {
      case "EV":
        data = elevatorData.DATA
          ? elevatorData.DATA.filter((d) => d.stn_nm.includes(stationName))
          : elevatorData.filter((d) => d.stn_nm.includes(stationName));
        break;

      case "ES": {
        const escalatorList = escalatorData.DATA || escalatorData;
        data = escalatorList.filter((d) => {
          const name = d["역명"] || d["역사명"] || d["역  명"] || d["역"] || "";
          return name.replace(/\s/g, "").includes(stationName.replace(/\s/g, ""));
        });
        break;
      }

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

  // 팬/줌 설정
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[styles.mapWrapper, { transform: [...pan.getTranslateTransform(), { scale }] }]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setImgLayout({ width, height });
              const imgAspect = IMG_ORIGINAL_WIDTH / IMG_ORIGINAL_HEIGHT;
              const viewAspect = width / height;
              let offsetX = 0,
                offsetY = 0;
              if (imgAspect > viewAspect) {
                const drawH = width / imgAspect;
                offsetY = (height - drawH) / 2;
              } else {
                const drawW = height * imgAspect;
                offsetX = (width - drawW) / 2;
              }
              setOffset({ x: offsetX, y: offsetY });
            }}
          />

          <Svg style={[styles.overlay, { width: imgLayout.width, height: imgLayout.height }]}>
            {tempPoints.map((p, i) => {
              const cx = (p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width + offset.x;
              const cy = (p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height + offset.y;
              return <BubbleMarker key={i} cx={cx} cy={cy} type={p.type} />;
            })}
          </Svg>

          {/* 뒤로가기 버튼 */}
          <View pointerEvents="box-none" style={styles.backOverlay}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
              style={styles.backFab}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* 하단 리스트 */}
      <View style={styles.listContainer}>
        {facilities.length === 0 ? (
          <Text style={[styles.empty, { fontSize: responsiveFontSize(15) + fontOffset }]}>
            해당 시설 정보가 없습니다.
          </Text>
        ) : (
          facilities.map((item, idx) => (
            <View key={idx} style={styles.mintCard}>
              <View style={styles.cardHeader}>
                <Image source={ICONS[type]} style={styles.cardIcon} />
                <Text
                  style={[
                    styles.facilityTitle,
                    { fontSize: responsiveFontSize(17) + fontOffset },
                  ]}
                >
                  {TYPE_LABEL[type]}
                </Text>
              </View>
              <Text
                style={[
                  styles.facilityDesc,
                  { fontSize: responsiveFontSize(14) + fontOffset },
                ]}
              >
                {extractDetail(item, type)}
              </Text>
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
    case "LO":
      return item["상세위치"] || "";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  imageContainer: { width: screenW, height: screenH * 0.6, overflow: "hidden" },
  mapWrapper: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: { position: "absolute", top: 0, left: 0 },
  backOverlay: { position: "absolute", top: 25, left: 0, right: 0, zIndex: 10 },
  backFab: {
    position: "absolute",
    top: 20,
    left: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  listContainer: { padding: 12, backgroundColor: "#fff" },
  mintCard: {
    backgroundColor: "#EEFFFE",
    borderWidth: 1.5,
    borderColor: "#14CAC9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardIcon: { width: 22, height: 22, marginRight: 6, resizeMode: "contain" },
  facilityTitle: { fontWeight: "700", color: "#0F6B6A" },
  facilityDesc: { color: "#1A1A1A", marginTop: 2 },
  empty: { textAlign: "center", color: "#666", marginTop: 10 },
});
