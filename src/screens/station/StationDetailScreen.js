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
// 아이콘 라이브러리 임포트
import { Ionicons, FontAwesome5, FontAwesome6, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"; 
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import { responsiveFontSize, responsiveWidth } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import lineJson from "../../assets/metro-data/metro/line/data-metro-line-1.0.0.json";

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

  // ... (useEffect, handleFavoriteToggle, goToFacilityMap 함수는 동일) ...
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

      if (isFavorite) {
        const docSnap = await getDoc(userDocRef);
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

  const goToFacilityMap = (type) => {
    navigation.push("BarrierFreeMap", {
      stationName,
      stationCode,
      lines,
      type,
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
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.lineBadgeText, 
                      { 
                        color: textColor,
                        fontSize: 12 + fontOffset 
                      }
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
          <Text
            style={[styles.codeText, { fontSize: responsiveFontSize(12) + fontOffset }]}
          >
            코드: {stationCode}
          </Text>
        </View>

        <View style={styles.buttonListContainer}>
          {/* [유지] 리스트형 레이아웃 (chevron 아이콘 포함) */}
          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("EV")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="elevator-passenger-outline" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                엘리베이터
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("ES")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="escalator" size={responsiveFontSize(28) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                에스컬레이터
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("LO")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="locker-multiple" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                보관함
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("WL")}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="human-wheelchair" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                휠체어 리프트
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("VO")}>
            <View style={styles.buttonLeft}>
              <Ionicons name="volume-high" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                음성유도기
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("TO")}>
            <View style={styles.buttonLeft}>
              <FontAwesome5 name="restroom" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                화장실
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("DT")}>
            <View style={styles.buttonLeft}>
              <FontAwesome6 name="wheelchair" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                장애인 화장실
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={responsiveFontSize(20) + fontOffset} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("NU")}>
            <View style={styles.buttonLeft}>
              <MaterialIcons name="baby-changing-station" size={responsiveFontSize(26) + fontOffset} color={INK} />
              <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                수유실
              </Text>
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
  scrollContainer: {
    paddingBottom: 30,
  },
  mintHeader: {
    backgroundColor: BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    width: '100%',
  },
  lineBadge: {
    justifyContent: "center",
    alignItems: "center",
  },
  lineBadgeText: { 
    fontWeight: "bold",
  },
  headerTitle: { 
    color: INK, 
    fontWeight: "bold",
    textAlign: 'center',
  },
  starBtn: { padding: 6 },
  infoBox: { 
    alignItems: "center", 
    marginTop: 24,
    marginBottom: 16,
  },
  codeText: { 
    color: "#6B7280", 
    marginTop: 4,
  },
  buttonListContainer: {
    width: '100%',
    paddingHorizontal: '5%',
  },
  // [수정] iconButton 스타일: 그림자(elevation) 다시 추가
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // 양쪽으로 분리
    backgroundColor: "#F1FAFA",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18, // 카드형에 어울리게 18로 복원
    elevation: 3, // 그림자 추가
    marginBottom: 16, // 카드형에 어울리게 16으로 복원
  },
  // [유지] 아이콘과 텍스트를 묶는 View
  buttonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconLabel: { 
    color: INK,
    fontWeight: "bold",
  },
});