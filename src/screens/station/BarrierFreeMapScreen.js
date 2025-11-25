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
  Dimensions,
  Alert,
  AccessibilityInfo,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Svg, { Rect, Path, G, Image as SvgImage } from "react-native-svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { useApiFacilities } from "../../hook/useApiFacilities";
import { useLocalFacilities } from "../../hook/useLocalFacilities";
import { useLocalPhoneNumber } from "../../hook/useLocalPhoneNumber";
import { usePhoneCall } from "../../hook/usePhoneCall";
import stationCoords from "../../assets/metro-data/metro/station/station_coords.json";
import styles, { colors } from "../../styles/BarrierFreeMapScreen.styles";

import CustomButton from "../../components/CustomButton";

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
  const label = TYPE_LABEL[type] || "시설";

  return (
    <G x={cx} y={cy} accessibilityLabel={label} accessibilityRole="image">
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

function extractDetail(item, type) {
  if (item?.desc) return item.desc;
  const base = TYPE_LABEL[type] || "시설";
  const loc = item?.location || "";
  const name = item?.stationName || "";
  const extra = item?.externalCode ? `외부역번호 ${item.externalCode}` : "";
  return [name, base, loc, extra].filter(Boolean).join(" · ");
}

/**
 * 스크린리더용 문장 패턴 생성
 * 예) "강남역 1번 출구 앞 엘리베이터. 현재 정상 운행 중입니다."
 */
function buildAccessibleFacilitySentence(item, type, stationName) {
  const facilityLabel = TYPE_LABEL[type] || "시설";

  const station =
    stationName ||
    item?.stationName ||
    "";

  // 위치 텍스트 추출 (location > desc 첫 문장 > 빈 문자열)
  let location = "";
  if (item?.location) {
    location = item.location;
  } else if (item?.desc) {
    const firstSentence = item.desc.split(/[\.]/)[0];
    location = firstSentence.trim();
  }

  // 상태 텍스트 추출 (✅ EV / ES 에서만 사용)
  const rawStatus = item?.status || item?.operation || "";

  let statusSentence = "";
  if (type === "EV" || type === "ES") {
    if (!rawStatus) {
      // 상태가 아예 없으면 그냥 설치 안내 정도로
      statusSentence = "현재 상태 정보가 제공되지 않습니다.";
    } else if (/보수|점검|중단|고장|불가|불능/i.test(rawStatus)) {
      statusSentence = `${rawStatus}으로 이용이 어려울 수 있습니다.`;
    } else if (/정상|운행|가능|사용 가능/i.test(rawStatus)) {
      statusSentence = "현재 정상 운행 중입니다.";
    } else {
      statusSentence = `상태: ${rawStatus}입니다.`;
    }
  }
  // 🔹 EV/ES가 아니면 statusSentence는 빈 문자열 그대로 유지 → 상태 문장 없음

  // 앞부분 문장 구성
  const pieces = [];
  if (station) pieces.push(`${station}역`);
  if (location) {
    pieces.push(location);
  }

  const prefix = pieces.length > 0 ? pieces.join(" ") : facilityLabel;

  // 최종 문장
  if (statusSentence) {
    return `${prefix} ${facilityLabel}. ${statusSentence}`;
  }
  // 🔹 상태 문장 없이 위치+종류만
  return `${prefix} ${facilityLabel}.`;
}


export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();
  const {
    stationName = "서울역",
    stationCode = "",
    type = "EV",
    imageUrl = null,
  } = route.params || {};

  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  const realStationName = stationName === "서울역" ? "서울" : stationName;
  const { phone } = useLocalPhoneNumber(realStationName);
  const { makeCall } = usePhoneCall();

  const handleCallPress = () => {
    if (!phone) {
      Alert.alert("안내", "이 역의 전화번호 정보를 찾을 수 없습니다.");
      return;
    }
    Alert.alert(
      "전화 연결",
      `${phone}\n\n이 번호로 전화를 거시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "전화 걸기", onPress: () => makeCall(phone) },
      ],
      { cancelable: true }
    );
  };

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
      headerBackAccessibilityLabel: "뒤로가기",
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

  const [imgLayout, setImgLayout] = useState({ width: 1, height: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };
    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (isEnabled) => {
        setIsScreenReaderEnabled(isEnabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

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

  const isTest = false; // 테스트 모드

  useEffect(() => {
    const apiSupported = ["EV", "ES", "TO", "DT", "WC"].includes(type);
    setLoading(true);

    if (isTest) {
      if (!local.loading) {
        setFacilities(local.data || []);
        setDataSource("LOCAL");
        setLoading(false);
      }
      return;
    }

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
          Animated.event([null, { dx: pan.x, dy: pan.y }], {
            useNativeDriver: false,
          })(evt, gestureState);
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

  const noticeBoxStyle = {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 20,
  };

  const noticeTextStyle = {
    flex: 1,
    color: "#17171B",
    fontWeight: "700",
    fontFamily: "NotoSansKR",
  };

  return (
    <ScrollView style={styles.container}>
      {/* ✅ 스크린리더가 켜져 있으면 지도 섹션 전체 숨김 */}
      {!isScreenReaderEnabled && coords.length > 0 && (
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
              accessibilityLabel={`${stationName} ${TYPE_LABEL[type]} 안내도`}
            />

            <Svg
              style={[
                styles.overlay,
                { width: imgLayout.width, height: imgLayout.height },
              ]}
            >
              {coords.map((p, i) => {
                const cx =
                  (p.x / IMG_ORIGINAL_WIDTH) * imgLayout.width + offset.x;
                const cy =
                  (p.y / IMG_ORIGINAL_HEIGHT) * imgLayout.height +
                  offset.y +
                  20;
                return <BubbleMarker key={i} cx={cx} cy={cy} type={p.type} />;
              })}
            </Svg>
          </Animated.View>
        </View>
      )}

      <View>
        {/* ✅ 지도 안내 문구도 스크린리더일 땐 숨김 */}
        {!isScreenReaderEnabled && (
          <View style={noticeBoxStyle}>
            <Ionicons
              name="information-circle-outline"
              size={responsiveFontSize(22) + fontOffset / 2}
              color="#0B5FFF"
              style={{ marginRight: 8 }}
              accessibilityHidden={true}
            />
            <Text
              style={[
                noticeTextStyle,
                { fontSize: responsiveFontSize(15) + fontOffset },
              ]}
            >
              두 손가락으로 지도를 확대/축소 할 수 있습니다.
            </Text>
          </View>
        )}

        {dataSource === "LOCAL" && (
          <View
            style={[
              noticeBoxStyle,
              {
                backgroundColor: "#FFF3CD",
                borderColor: "#FFD966",
                borderWidth: 1.2,
                marginTop: 8,
              },
            ]}
            accessibilityRole="alert"
          >
            <Ionicons
              name="alert-circle-outline"
              size={responsiveFontSize(22) + fontOffset / 2}
              style={{ marginRight: 8 }}
              accessibilityHidden={true}
            />
            <Text
              style={[
                noticeTextStyle,
                { fontSize: responsiveFontSize(15) + fontOffset },
              ]}
            >
              실시간 정보가 아닙니다. 자세한 정보는 역으로 문의해주세요.
            </Text>
          </View>
        )}

        {/* ✅ 스크린리더 전용 안내 문구 */}
        {isScreenReaderEnabled && (
          <View
            style={[noticeBoxStyle, { marginTop: 8 }]}
            accessibilityRole="alert"
          >
            <Ionicons
              name="information-circle-outline"
              size={responsiveFontSize(22) + fontOffset / 2}
              color="#0B5FFF"
              style={{ marginRight: 8 }}
              accessibilityHidden={true}
            />
            <Text
              style={[
                noticeTextStyle,
                { fontSize: responsiveFontSize(15) + fontOffset },
              ]}
            >
              화면을 내리거나 올리려면 두 손가락으로 미세요.
            </Text>
          </View>
        )}
      </View>

      {type === "WL" && phone && (
        <View style={styles.buttonContainer}>
          <CustomButton
            type="call"
            onPress={handleCallPress}
            style={styles.buttonContentLayout}
            accessibilityLabel={`휠체어 리프트 이용 문의 전화 걸기, ${phone}`}
            accessibilityHint="탭하면 전화가 연결됩니다."
          >
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons
                name="phone"
                size={responsiveFontSize(26) + fontOffset}
                color={colors.text}
                accessibilityHidden={true}
              />
              <Text
                style={[
                  styles.iconLabel,
                  { fontSize: responsiveFontSize(16) + fontOffset },
                ]}
              >
                전화 걸기
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={responsiveFontSize(20) + fontOffset}
              color={colors.text}
              accessibilityHidden={true}
            />
          </CustomButton>
        </View>
      )}

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text
              style={[
                styles.empty,
                { fontSize: responsiveFontSize(16) + fontOffset },
              ]}
            >
              시설 정보를 불러오는 중...
            </Text>
          </View>
        ) : facilities.length === 0 ? (
          <View style={styles.center}>
            <Text
              style={[
                styles.empty,
                { fontSize: responsiveFontSize(16) + fontOffset },
              ]}
            >
              해당 시설 정보가 없습니다.
            </Text>
          </View>
        ) : (
          facilities.map((item, idx) => {
            const isApi = dataSource === "API";

            const isUnavailable =
              isApi &&
              ["EV", "ES"].includes(type) &&
              item.status &&
              /보수중/i.test(item.status);

            const cardStyle = [
              styles.card,
              isUnavailable
                ? { borderColor: "#D32F2F", borderWidth: 2.5 }
                : isApi
                ? { borderColor: colors.primary }
                : styles.cardBorderLocal,
            ];

            // ✅ 스크린리더 ON일 때 읽힐 문장
            const accessibleSentence = isScreenReaderEnabled
              ? buildAccessibleFacilitySentence(item, type, stationName)
              : null;

            const descriptionText = isScreenReaderEnabled
              ? accessibleSentence
              : extractDetail(item, type);

            return (
              <View
                key={idx}
                style={cardStyle}
                accessible={true}
                accessibilityLabel={
                  accessibleSentence ||
                  `${TYPE_LABEL[type] || "시설"} 정보 카드`
                }
              >
                <View style={styles.cardHeader}>
                  <Image
                    source={ICONS[type] || ICONS["EV"]}
                    style={styles.cardIcon}
                    accessibilityHidden={true}
                  />
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
                      lineHeight:
                        (responsiveFontSize(15) + fontOffset) * 1.47,
                    },
                  ]}
                >
                  {descriptionText}
                </Text>

                {(type === "EV" || type === "ES") && item.status && (
  <Text
    style={{
      textAlign: "right",
      color: isUnavailable
        ? "#D32F2F"
        : colors.textSecondary,
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
