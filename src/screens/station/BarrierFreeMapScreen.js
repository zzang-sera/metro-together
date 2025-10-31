// src/screens/station/BarrierFreeMapScreen.js
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Svg, { Rect, Path, G, Image as SvgImage } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { useApiFacilities } from "../../hook/useApiFacilities";
import { useLocalFacilities } from "../../hook/useLocalFacilities";
import stationCoords from "../../assets/metro-data/metro/station/station_coords.json";
import styles, { colors } from "../../styles/BarrierFreeMapScreen.styles";

const { width: screenW, height: screenH } = Dimensions.get("window");
const IMG_ORIGINAL_WIDTH = 3376;
const IMG_ORIGINAL_HEIGHT = 3375;

const ICONS = {
  EV: require("../../assets/function-icon/Elevator_for_all.png"),
  ES: require("../../assets/function-icon/Escalator.png"),
  TO: require("../../assets/function-icon/Bathromm_for_all.png"),
  DT: require("../../assets/function-icon/Disablities_bathroom.png"),
  WL: require("../../assets/function-icon/Lift.png"),
  WC: require("../../assets/function-icon/Wheelchair_Charging.png"),
  VO: require("../../assets/function-icon/mic.png"),
  NU: require("../../assets/function-icon/Baby.png"),
  LO: require("../../assets/function-icon/Lost and Found.png"),
};

const TYPE_LABEL = {
  EV: "엘리베이터",
  ES: "에스컬레이터",
  TO: "화장실",
  DT: "장애인 화장실",
  WL: "휠체어 리프트",
  WC: "휠체어 급속충전",
  VO: "음성유도기",
  NU: "수유실",
  LO: "보관함",
  WC: "휠체어 급속충전",
};

// ✅ 마커 표시용
function BubbleMarker({ cx, cy, type }) {
  const BUBBLE_WIDTH = 10;
  const BUBBLE_HEIGHT = 10;
  const ICON_SIZE = 9;
  const iconSrc = ICONS[type] || ICONS["EV"];
  const halfW = BUBBLE_WIDTH / 2;
  const rectY = -BUBBLE_HEIGHT - 2;
  const iconX = -ICON_SIZE / 2;
  const iconY = rectY + (BUBBLE_HEIGHT - ICON_SIZE) / 2;
  const tailPath = "M 0 0 L -6 -2 L 6 -2 Z";

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

const getStatusCategory = (status) => {
  if (!status || status === "-") return "none";
  const s = status.toLowerCase();
  if (s.includes("보수") || s.includes("불가") || s.includes("점검") || s.includes("중지"))
    return "unavailable";
  if (s.includes("가능") || s.includes("운행")) return "available";
  return "none";
};

// ✅ desc 자동 생성 (fallback용)
function extractDetail(item, type) {
  if (item?.desc) return item.desc;
  const base = TYPE_LABEL[type] || "시설";
  const loc = item?.location || "";
  const name = item?.stationName || "";
  const extra = item?.externalCode ? `외부역번호 ${item.externalCode}` : "";
  return [name, base, loc, extra].filter(Boolean).join(" · ");
}

export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();
  const { stationName = "서울역", stationCode = "", type = "EV", imageUrl = null } =
    route.params || {};

  // ✅ 헤더 설정
  useLayoutEffect(() => {
    const label = TYPE_LABEL[type] || "무장애 안내";
    navigation.setOptions({
      headerShown: true,
      title: `${label} 안내`,
      headerTitleAlign: "center",
      headerTintColor: "#17171B",
      headerStyle: { backgroundColor: "#F9F9F9", elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: {
        fontFamily: "NotoSansKR",
        fontWeight: "700",
        fontSize: responsiveFontSize(18) + fontOffset,
        color: "#17171B",
      },
    });
  }, [navigation, type, fontOffset]);

  const cleanName = (() => {
    if (!stationName) return "";
    let name = stationName.replace(/\(.*\)/g, "").trim();
    if (name === "서울") return "서울역";
    return name.replace(/역$/, "");
  })();

  const [coords, setCoords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState(null);

  const api = useApiFacilities(cleanName, stationCode, null, type);
  const local = useLocalFacilities(cleanName, stationCode, null, type);

  // 지도 계산용
  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 좌표 로드
  useEffect(() => {
    try {
      const filtered = stationCoords.filter(
        (p) =>
          p.station.replace(/\(.*\)/g, "").trim() === cleanName &&
          p.type.toUpperCase() === type.toUpperCase()
      );
      setCoords(filtered);
    } catch (e) {
      console.error("🚨 좌표 로드 오류:", e);
    }
  }, [cleanName, type]);

  // API/로컬 fallback
  useEffect(() => {
    const apiSupported = ["EV", "ES", "TO", "DT", "WC"].includes(type);
    setLoading(true);

    if (apiSupported) {
      if (!api.loading && api.data.length > 0) {
        setFacilities(api.data);
        setDataSource("API");
      } else if (!api.loading && api.data.length === 0 && !local.loading) {
        setFacilities(local.data || []);
        setDataSource("LOCAL");
      } else if (!api.loading && api.error && !local.loading) {
        setFacilities(local.data || []);
        setDataSource("LOCAL");
      }
    } else {
      if (!local.loading) {
        setFacilities(local.data);
        setDataSource("LOCAL");
      }
    }

    if (!api.loading && !local.loading) setLoading(false);
  }, [type, api, local]);

  // 팬/줌
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const baseScale = useRef(1);
  const initialDistance = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
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
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  if (coords.length === 0 && loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.empty, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          지도와 시설 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 지도 */}
      {coords.length > 0 && (
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
              {coords.map((p, i) => {
                const cx = (p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width + offset.x;
                const cy = (p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height + offset.y;
                return <BubbleMarker key={i} cx={cx} cy={cy} type={p.type} />;
              })}
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* 리스트 */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.empty, { fontSize: responsiveFontSize(16) + fontOffset }]}>
              시설 정보를 불러오는 중...
            </Text>
          </View>
        ) : facilities.length === 0 ? (
          <Text style={[styles.empty, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            해당 시설 정보가 없습니다.
          </Text>
        ) : (
          facilities.map((item, idx) => {
            const isApi = dataSource === "API";
            const statusCategory = isApi ? getStatusCategory(item.status) : "none";
            const cardStyle = [
              styles.card,
              isApi ? { borderColor: colors.primary } : styles.cardBorderLocal,
            ];

            return (
              <View key={idx} style={cardStyle}>
                <View style={styles.cardHeader}>
                  <Image source={ICONS[type] || ICONS["EV"]} style={styles.cardIcon} />
                  <Text
                    style={[
                      styles.facilityTitle,
                      { fontSize: responsiveFontSize(18) + fontOffset },
                    ]}
                  >
                    {TYPE_LABEL[type]}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.facilityDesc,
                    {
                      fontSize: responsiveFontSize(15) + fontOffset,
                      lineHeight: (responsiveFontSize(15) + fontOffset) * 1.47,
                    },
                  ]}
                >
                  {extractDetail(item, type)}
                </Text>

                {item.status && (
                  <Text
                    style={{
                      textAlign: "right",
                      color: colors.textSecondary,
                      fontSize: responsiveFontSize(13) + fontOffset,
                      fontWeight: "700",
                    }}
                  >
                    {item.status}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
