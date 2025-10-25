import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import { responsiveFontSize, responsiveWidth } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import lineJson from "../../assets/metro-data/metro/line/data-metro-line-1.0.0.json";

const lineData = lineJson.DATA;
const MINT = "#21C9C6";
const INK = "#003F40";
const BG = "#F9F9F9";

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

  // ✅ 즐겨찾기 실시간 반영 (새 구조 & 기존 구조 모두 지원)
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

  // ✅ 즐겨찾기 추가/제거 (다중호선 구조)
  const handleFavoriteToggle = async () => {
    if (!currentUser || !stationCode) {
      Alert.alert("로그인 필요", "즐겨찾기 기능은 로그인 후 이용할 수 있습니다.");
      return;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      const favObj = { stationCode, stationName, lines };

      if (isFavorite) {
        // 삭제 시는 stationCode 기준 필터링
        const docSnap = await userDocRef.get?.();
        if (!docSnap) {
          await updateDoc(userDocRef, { favorites: arrayRemove(favObj) });
        } else {
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
        <StatusBar barStyle="dark-content" backgroundColor={MINT} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24 + fontOffset / 2} color={INK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.lineContainer}>
            {Array.from({ length: Math.ceil(lines.length / 2) }).map((_, rowIndex) => {
              const pair = lines.slice(rowIndex * 2, rowIndex * 2 + 2);
              return (
                <View key={`row-${rowIndex}`} style={styles.lineRow}>
                  {pair.map((line) => {
                    const color = getLineColor(line);
                    const textColor = getTextColorForBackground(color);
                    return (
                      <View key={line} style={[styles.lineBadge, { backgroundColor: color }]}>
                        <Text style={[styles.lineBadgeText, { color: textColor }]}>
                          {line.replace("호선", "")}
                        </Text>
                      </View>
                    );
                  })}
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

      <View style={styles.infoBox}>
        <Text
          style={[styles.lineText, { fontSize: responsiveFontSize(16) + fontOffset }]}
        >
          {lines.join(" / ")}
        </Text>
        <Text
          style={[styles.codeText, { fontSize: responsiveFontSize(12) + fontOffset }]}
        >
          코드: {stationCode}
        </Text>
      </View>

      {/* ✅ 기존 아이콘 기능 유지 */}
      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("EV")}>
          <Ionicons name="cube-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>엘리베이터</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("ES")}>
          <Ionicons name="swap-vertical-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>에스컬레이터</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("LO")}>
          <Ionicons name="briefcase-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>보관함</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("WL")}>
          <Ionicons name="walk-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>휠체어 리프트</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("VO")}>
          <Ionicons name="volume-high-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>음성유도기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("TO")}>
          <Ionicons name="water-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>화장실</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("DT")}>
          <Ionicons name="accessibility-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>장애인 화장실</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => goToFacilityMap("NU")}>
          <Ionicons name="body-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>수유실</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  mintHeader: {
    backgroundColor: MINT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerBtn: { width: 36, alignItems: "center" },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  lineContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: 6,
    gap: 4,
  },
  lineRow: { flexDirection: "row", gap: 4 },
  lineBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  lineBadgeText: { fontWeight: "bold", fontSize: 12 },
  headerTitle: { color: INK, fontWeight: "bold" },
  starBtn: { padding: 6 },
  infoBox: { alignItems: "center", marginTop: 16, marginBottom: 30 },
  lineText: { color: "#003F40", fontWeight: "600" },
  codeText: { color: "#6B7280", marginTop: 4 },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 30,
  },
  iconButton: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1FAFA",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 18,
    elevation: 3,
  },
  iconLabel: { color: INK, fontWeight: "bold" },
});
