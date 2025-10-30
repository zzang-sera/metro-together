// ✅ src/screens/station/StationDetailScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  FontAwesome6,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import { responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import lineJson from "../../assets/metro-data/metro/line/data-metro-line-1.0.0.json";
import { getStationImageByName } from "../../api/metro/metroAPI";
import { useLocalFacilities } from "../../hook/useLocalFacilities";
import { useApiFacilities } from "../../hook/useApiFacilities";

const lineData = lineJson.DATA;
const INK = "#17171B";
const BG = "#F9F9F9";
const BASE_ICON_SIZE = 22;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : "#666666";
}

function getTextColorForBackground(hexColor) {
  if (!hexColor) return "#FFFFFF";
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#17171B" : "#FFFFFF";
}

export default function StationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { stationName, stationCode, lines = [] } = route.params || {};
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();
  const currentUser = auth.currentUser;

  const [isFavorite, setIsFavorite] = useState(false);
  const [stationImage, setStationImage] = useState(null);
  const [facilityAvailability, setFacilityAvailability] = useState({});

  const displayName = stationName === "서울" ? "서울역" : stationName;
  const realStationName = stationName === "서울역" ? "서울" : stationName;

  // ✅ 안내도 로드
  useEffect(() => {
    async function loadImage() {
      try {
        if (realStationName) {
          const res = await getStationImageByName(realStationName);
          if (res?.length) {
            setStationImage(res[0].image.uri);
          } else {
            setStationImage(null);
          }
        }
      } catch (e) {
        console.error("🚨 getStationImageByName error:", e);
        setStationImage(null);
      }
    }
    loadImage();
  }, [realStationName]);

  // ✅ 각 시설별 로컬 데이터 훅
  const facilityTypes = ["EV", "ES", "TO", "DT", "WL", "WC", "VO", "NU", "LO"];
  const facilityDataHooks = {};
  facilityTypes.forEach((t) => {
    facilityDataHooks[t] = useLocalFacilities(displayName, stationCode, null, t);
  });

  // ✅ 휠체어 급속충전(WC)용 API 데이터
  const wcApi = useApiFacilities(displayName, stationCode, null, "WC");

  useEffect(() => {
    const status = {};
    facilityTypes.forEach((t) => {
      const hasList =
        t === "WC"
          ? wcApi?.data?.length > 0 // 🔹 WC는 API 기준으로 판단
          : facilityDataHooks[t]?.data?.length > 0;

      const hasMap = !!stationImage;
      const disabled =
        (!hasList && !hasMap) || (hasMap && !hasList); // 둘 다 없거나 안내도만 있는 경우

      status[t] = { hasList, hasMap, disabled };
    });
    setFacilityAvailability(status);
  }, [
    stationImage,
    wcApi.data,
    ...facilityTypes.map((t) => facilityDataHooks[t]?.data),
  ]);

  // ✅ 즐겨찾기 관리
  useEffect(() => {
    if (!currentUser || !stationCode) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const favs = docSnap.data().favorites || [];
        const found = favs.some((f) =>
          typeof f === "string"
            ? f === stationCode
            : f.stationCode === stationCode
        );
        setIsFavorite(found);
      }
    });
    return () => unsubscribe();
  }, [currentUser, stationCode]);

  const handleFavoriteToggle = async () => {
    if (!currentUser || !stationCode) {
      Alert.alert("로그인 필요", "즐겨찾기 기능은 로그인 후 이용할 수 있습니다.");
      return;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      const favObj = { stationName: realStationName, stationCode, lines };
      const docSnap = await getDoc(userDocRef);
      if (isFavorite) {
        if (docSnap.exists()) {
          const currentFavs = docSnap.data().favorites || [];
          const updated = currentFavs.filter(
            (f) =>
              !(f.stationCode === stationCode || f === stationCode)
          );
          await updateDoc(userDocRef, { favorites: updated });
        }
      } else {
        await updateDoc(userDocRef, { favorites: arrayUnion(favObj) });
      }
    } catch (err) {
      console.error("즐겨찾기 오류:", err);
      Alert.alert("오류", "즐겨찾기 업데이트 중 문제가 발생했습니다.");
    }
  };

  // ✅ 버튼 클릭
  const handlePress = (type) => {
    const facility = facilityAvailability[type];
    if (!facility || facility.disabled) {
      Alert.alert("안내", "이 역의 해당 시설 정보는 아직 준비 중이에요.");
      return;
    }

    navigation.push("BarrierFreeMap", {
      stationName: realStationName,
      stationCode,
      lines,
      type,
      imageUrl: stationImage || null,
    });
  };

  // ✅ 헤더
  const Header = useMemo(
    () => (
      <View style={[styles.mintHeader, { paddingTop: insets.top + 6 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24 + fontOffset / 2} color={INK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.lineContainer}>
            {lines.map((line) => {
              const color = getLineColor(line);
              const textColor = getTextColorForBackground(color);
              const dynamicIconSize = BASE_ICON_SIZE + fontOffset;
              return (
                <View
                  key={line}
                  style={[
                    styles.lineBadge,
                    {
                      backgroundColor: color,
                      width: dynamicIconSize,
                      height: dynamicIconSize,
                      borderRadius: dynamicIconSize / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.lineBadgeText,
                      { color: textColor, fontSize: 12 + fontOffset },
                    ]}
                  >
                    {line.replace("호선", "")}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text
            style={[
              styles.headerTitle,
              { fontSize: responsiveFontSize(18) + fontOffset },
            ]}
          >
            {displayName || "역명"}
          </Text>
        </View>

        <TouchableOpacity onPress={handleFavoriteToggle} style={styles.starBtn}>
          <Ionicons
            name={isFavorite ? "star" : "star-outline"}
            size={24 + fontOffset / 2}
            color={isFavorite ? "#FFD700" : INK}
          />
        </TouchableOpacity>
      </View>
    ),
    [navigation, displayName, lines, fontOffset, insets.top, isFavorite]
  );

  const buttons = [
    { icon: "elevator-passenger-outline", label: "엘리베이터", type: "EV" },
    { icon: "escalator", label: "에스컬레이터", type: "ES" },
    { icon: "restroom", label: "화장실", type: "TO", pack: FontAwesome5 },
    { icon: "wheelchair", label: "장애인 화장실", type: "DT", pack: FontAwesome6 },
    { icon: "human-wheelchair", label: "휠체어 리프트", type: "WL" },
    { icon: "battery-charging", label: "휠체어 급속충전", type: "WC" },
    { icon: "volume-high", label: "음성유도기", type: Ionicons },
    { icon: "baby-changing-station", label: "수유실", type: "NU", pack: MaterialIcons },
    { icon: "locker-multiple", label: "보관함", type: "LO" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {Header}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.infoBox}>
          <Text style={[styles.codeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
            코드: {stationCode}
          </Text>
        </View>

        <View style={styles.buttonListContainer}>
          {buttons.map((btn) => {
            const IconPack = btn.pack || MaterialCommunityIcons;
            const isDisabled = facilityAvailability[btn.type]?.disabled;

            return (
              <TouchableOpacity
                key={btn.type}
                style={[
                  styles.iconButton,
                  isDisabled && { backgroundColor: "#E0E0E0" },
                ]}
                onPress={() => handlePress(btn.type)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <View style={styles.buttonLeft}>
                  <IconPack
                    name={btn.icon}
                    size={responsiveFontSize(26) + fontOffset}
                    color={isDisabled ? "#9E9E9E" : INK}
                  />
                  <Text
                    style={[
                      styles.iconLabel,
                      {
                        fontSize: responsiveFontSize(16) + fontOffset,
                        color: isDisabled ? "#9E9E9E" : INK,
                      },
                    ]}
                  >
                    {btn.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={responsiveFontSize(20) + fontOffset}
                  color={isDisabled ? "#9E9E9E" : INK}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContainer: { paddingBottom: 30 },
  mintHeader: {
    backgroundColor: BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    elevation: 3,
  },
  headerBtn: { width: 36, alignItems: "center" },
  headerCenter: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  lineContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    width: "100%",
  },
  lineBadge: { justifyContent: "center", alignItems: "center" },
  lineBadgeText: { fontWeight: "bold" },
  headerTitle: { color: INK, fontWeight: "bold", textAlign: "center" },
  starBtn: { padding: 6 },
  infoBox: { alignItems: "center", marginTop: 24, marginBottom: 16 },
  codeText: { color: "#6B7280", marginTop: 4 },
  buttonListContainer: { width: "100%", paddingHorizontal: "5%" },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1FAFA",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 40,
    elevation: 3,
    marginBottom: 16,
  },
  buttonLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconLabel: { color: INK, fontWeight: "bold" },
});
