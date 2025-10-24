// 🏙️ StationDetailScreen.js
// 기능 요약:
// - 역 상세 화면: 노선, 역명, 코드, 즐겨찾기 표시
// - 기존 시설(엘리베이터, 에스컬레이터, 보관함, 휠체어리프트, 음성유도기) 유지
// - 새로 화장실, 장애인 화장실, 수유실 아이콘만 추가

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
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import { responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";

const MINT = "#21C9C6";
const INK = "#003F40";
const BG = "#F9F9F9";

export default function StationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { stationName, stationCode, line } = route.params || {};
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();

  const currentUser = auth.currentUser;
  const [isFavorite, setIsFavorite] = useState(false);

  /* ------------------ 즐겨찾기 반영 ------------------ */
  useEffect(() => {
    if (!currentUser || !stationCode) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const favs = docSnap.data().favorites || [];
        setIsFavorite(favs.includes(stationCode));
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
      if (isFavorite) {
        await updateDoc(userDocRef, { favorites: arrayRemove(stationCode) });
      } else {
        await updateDoc(userDocRef, { favorites: arrayUnion(stationCode) });
      }
    } catch (err) {
      console.error("즐겨찾기 오류:", err);
      Alert.alert("오류", "즐겨찾기 업데이트 중 문제가 발생했습니다.");
    }
  };

  /* ------------------ 헤더 ------------------ */
  const Header = useMemo(
    () => (
      <View style={[styles.mintHeader, { paddingTop: insets.top + 6 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={MINT} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24 + fontOffset / 2} color={INK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
              {line || "?"}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
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
    [navigation, stationName, line, fontOffset, insets.top, isFavorite]
  );

  /* ------------------ 렌더 ------------------ */
  return (
    <SafeAreaView style={styles.container}>
      {Header}

      <View style={styles.infoBox}>
        <Text style={[styles.lineText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          {line}
        </Text>
        <Text style={[styles.codeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
          코드: {stationCode}
        </Text>
      </View>

      {/* 1행: 엘리베이터 / 에스컬레이터 */}
      <View style={styles.iconRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "EV",
            })
          }
        >
          <Ionicons name="cube-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>엘리베이터</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "ES",
            })
          }
        >
          <Ionicons name="swap-vertical-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>에스컬레이터</Text>
        </TouchableOpacity>
      </View>

      {/* 2행: 보관함 / 휠체어 리프트 / 음성유도기 */}
      <View style={styles.iconRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "LO",
            })
          }
        >
          <Ionicons name="briefcase-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>보관함</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "WL",
            })
          }
        >
          <Ionicons name="walk-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>휠체어 리프트</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "VO",
            })
          }
        >
          <Ionicons name="volume-high-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>음성유도기</Text>
        </TouchableOpacity>
      </View>

      {/* 3행: 화장실 / 장애인 화장실 / 수유실 */}
      <View style={styles.iconRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "TO",
            })
          }
        >
          <Ionicons name="water-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>화장실</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "DT",
            })
          }
        >
          <Ionicons name="accessibility-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>장애인 화장실</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate("StationFacilities", {
              stationCode,
              stationName,
              line,
              type: "NU",
            })
          }
        >
          <Ionicons name="baby-outline" size={42} color={MINT} />
          <Text style={styles.iconLabel}>수유실</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ------------------ 스타일 ------------------ */
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  badge: { backgroundColor: "#AEEFED", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: INK, fontWeight: "bold" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconLabel: { color: INK, fontWeight: "bold" },
});
