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
import { getStationImageByName } from "../../api/metro/metroAPI"; // ✅ 추가

const lineData = lineJson.DATA;
const MINT = "#14CAC9";
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

  // ✅ 역 이미지 불러오기 (BarrierFreeMap / Line1RouteScreen용)
  useEffect(() => {
    async function loadImage() {
      try {
        if (stationName) {
          const res = await getStationImageByName(stationName);
          if (res?.length) {
            setStationImage(res[0].image.uri);
            console.log("🖼️ stationImage loaded:", res[0].image.uri);
          } else {
            console.warn("⚠️ No image found for", stationName);
          }
        }
      } catch (e) {
        console.error("🚨 getStationImageByName error:", e);
      }
    }
    loadImage();
  }, [stationName]);

  // ✅ 즐겨찾기 확인
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
      const favObj = { stationName, stationCode, lines };
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

  // ✅ 시설 버튼 클릭 시 → 지도 화면 이동 (이미지까지 전달)
  const goToFacilityMap = (type) => {
    if (!stationImage) {
      Alert.alert("잠시만요", "역 안내도가 아직 불러와지지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    navigation.push("BarrierFreeMap", {
      stationName,
      stationCode,
      lines,
      type,
      imageUrl: stationImage, // ✅ 추가된 핵심 라인
    });
  };

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
                      {
                        color: textColor,
                        fontSize: 12 + fontOffset,
                      },
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
            {stationName || "역명"}
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
    [navigation, stationName, lines, fontOffset, insets.top, isFavorite]
  );

  return (
    <SafeAreaView style={styles.container}>
      {Header}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.infoBox}>
          <Text style={[styles.codeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
            코드: {stationCode}
          </Text>
        </View>

        {/* ✅ 시설 선택 버튼들 */}
        <View style={styles.buttonListContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("EV")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="elevator-passenger-outline" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>엘리베이터</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("ES")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="escalator" size={responsiveFontSize(28) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>에스컬레이터</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("TO")}>
            <View style={styles.buttonLeft}>
              <FontAwesome5 name="restroom" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>화장실</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("DT")}>
            <View style={styles.buttonLeft}>
              <FontAwesome6 name="wheelchair" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>장애인 화장실</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("WL")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="human-wheelchair" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>휠체어 리프트</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("VO")}>
            <View style={styles.buttonLeft}>
              <Ionicons name="volume-high" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>휠체어 급속충전기</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("NU")}>
            <View style={styles.buttonLeft}>
              <MaterialIcons name="baby-changing-station" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>수유실</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("LO")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="locker-multiple" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>보관함</Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>
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
  headerCenter: { flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "center", flex: 1, marginHorizontal: 8 },
  lineContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 4, width: "100%" },
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
