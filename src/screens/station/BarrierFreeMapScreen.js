import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  PanResponder,
  Image,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Svg, { Rect, Path, G, Image as SvgImage } from "react-native-svg";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { useApiFacilities } from "../../hook/useApiFacilities";
import { useLocalFacilities } from "../../hook/useLocalFacilities";
import stationCoords from "../../assets/metro-data/metro/station/station_coords.json";
import styles, { colors } from "../../styles/BarrierFreeMapScreen.styles"; // colors도 import

// ... ICONS, TYPE_LABEL, BubbleMarker (변경 없음) ...
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
  WC: "휠체어 급속충전",
};

function BubbleMarker({ cx, cy, type }) {
  const BUBBLE_WIDTH = 10;
  const BUBBLE_HEIGHT = 10;
  const ICON_SIZE = 9;
  const iconSrc = ICONS[type] || ICONS["EV"];

  return (
    <G x={cx} y={cy}>
      <Rect
        x={-BUBBLE_WIDTH / 2}
        y={-BUBBLE_HEIGHT - 2}
        width={BUBBLE_WIDTH}
        height={BUBBLE_HEIGHT}
        rx={2}
        ry={2}
        fill="#fff"
        stroke="#fff"
        strokeWidth={1.2}
      />
      <Path d="M 0 0 L -5 -2 L 5 -2 Z" fill="#fff" stroke="#fff" strokeWidth={1.2} />
      <SvgImage
        href={iconSrc}
        x={-ICON_SIZE / 2}
        y={-BUBBLE_HEIGHT - 2 + (BUBBLE_HEIGHT - ICON_SIZE) / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
      />
    </G>
  );
}

const getStatusCategory = (status) => {
  if (!status || status === "-") {
    return "none";
  }
  const lowerStatus = status.toLowerCase();
  if (
    lowerStatus.includes("보수") ||
    lowerStatus.includes("불가") ||
    lowerStatus.includes("점검") ||
    lowerStatus.includes("중지")
  ) {
    return "unavailable";
  }
  if (lowerStatus.includes("가능") || lowerStatus.includes("운행")) {
    return "available";
  }
  return "none";
};

// --- Main Screen ---
export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const { stationName = "서울역", stationCode = "", type = "EV", imageUrl = null } =
    route.params || {};

  const { fontOffset } = useFontSize();

  const cleanName = (() => {
    if (!stationName) return "";
    let name = stationName.replace(/\(.*\)/g, "").trim();
    if (name === "서울") return "서울역";
    name = name.replace(/역$/, "");
    return name;
  })();

  const [coords, setCoords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState(null);

  const api = useApiFacilities(cleanName, stationCode, null, type);
  const local = useLocalFacilities(cleanName, stationCode, null, type);

  // ... 좌표 로드 (변경 없음) ...
  useEffect(() => {
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

  // ... API/로컬 fallback 로직 (변경 없음) ...
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
    
    if (!api.loading && !local.loading) {
        setLoading(false);
    }

  }, [type, api, local]);

  // --- 팬/줌 ---
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  // ✅ [수정] 누락된 useRef 변수 추가
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
      onPanResponderGrant: (evt, gestureState) => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      }
    })
  ).current;

  // ... 로딩 뷰 (변경 없음) ...
  if (coords.length === 0 && loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.empty, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          지도와 시설 정보를 불러오는 중...
        </Text>
      </View>
    );

  // ... 동적 스타일 함수 (변경 없음) ...
  const getCardBorderStyle = (category) => {
    switch (category) {
      case "available":
        return styles.cardBorderAvailable;
      case "unavailable":
        return styles.cardBorderUnavailable;
      default:
        return null;
    }
  };

  const getStatusTextStyle = (category) => {
    switch (category) {
      case "available":
        return styles.statusTextAvailable;
      case "unavailable":
        return styles.statusTextUnavailable;
      default:
        return null;
    }
  };

  // --- 렌더링 ---
  return (
    <ScrollView style={styles.container}>
      {/* ... 타이틀 (변경 없음) ... */}
      <Text style={[styles.title, { fontSize: responsiveFontSize(20) + fontOffset }]}>
        {cleanName} 무장애 지도
      </Text>

      {/* ... 지도 렌더링 (변경 없음) ... */}
      {coords.length > 0 && (
        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[styles.mapWrapper, { transform: [...pan.getTranslateTransform(), { scale }] }]}
          >
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
            <Svg style={[styles.overlay]}>
              {coords.map((p, i) => (
                <BubbleMarker key={`${p.station}_${i}`} cx={p.x} cy={p.y} type={p.type} />
              ))}
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* ... 시설 정보 리스트 (변경 없음) ... */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.empty, { fontSize: responsiveFontSize(16) + fontOffset }]}>
              시설 정보를 불러오는 중...
            </Text>
          </View>
        ) : (
          <>
            {dataSource === "LOCAL" && facilities.length > 0 && (
              <View style={styles.disclaimerBox}>
                <Text
                  style={[
                    styles.disclaimerText,
                    { fontSize: responsiveFontSize(13) + fontOffset },
                  ]}
                >
                  실시간 사용 가능 여부를 알 수 없는 시설입니다.
                </Text>
              </View>
            )}

            {facilities.length === 0 ? (
              <Text style={[styles.empty, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                해당 시설 정보가 없습니다.
              </Text>
            ) : (
              facilities.map((item, idx) => {
                const statusCategory =
                  dataSource === "API" ? getStatusCategory(item.status) : "none";

                return (
                  <View
                    key={idx}
                    style={[styles.card, getCardBorderStyle(statusCategory)]}
                  >
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
                      {item.desc || "위치 정보 없음"}
                    </Text>

                    <View style={styles.cardFooter}>
                      {statusCategory !== "none" ? (
                        <Text
                          style={[
                            styles.statusTextBase,
                            getStatusTextStyle(statusCategory),
                            { fontSize: responsiveFontSize(15) + fontOffset },
                          ]}
                        >
                          {item.status}
                        </Text>
                      ) : (
                        <View /> 
                      )}
                      
                      {item.contact ? (
                        <Text
                          style={[
                            styles.facilityContact,
                            { fontSize: responsiveFontSize(13) + fontOffset },
                          ]}
                        >
                          문의: {item.contact}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

