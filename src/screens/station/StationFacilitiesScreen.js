// 🧭 StationFacilitiesScreen.js
// 기능 요약:
// - useApiFacilities + useLocalFacilities 훅을 활용해 데이터 관리
// - 엘리베이터/에스컬레이터는 API → 로컬 fallback
// - 나머지는 로컬 JSON만 사용
// - “사당: n개 가져오는 중” 로그 출력

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

// ✅ 커스텀 훅
import { useApiFacilities } from "../../hook/useApiFacilities";
import { useLocalFacilities } from "../../hook/useLocalFacilities";

const MINT = "#21C9C6";
const INK = "#003F40";
const BG = "#F9F9F9";

export default function StationFacilitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fontOffset } = useFontSize();
  const insets = useSafeAreaInsets();

  const { stationCode = "", stationName = "", line = "", type } = route.params || {};
  const currentUser = auth.currentUser;

  const [isFavorite, setIsFavorite] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [usingLocal, setUsingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ 즐겨찾기 실시간 동기화
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

  // ✅ 즐겨찾기 토글
  const handleFavoriteToggle = async () => {
    if (!currentUser || !stationCode) {
      Alert.alert("로그인 필요", "즐겨찾기 기능은 로그인 후 이용할 수 있습니다.");
      return;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      if (isFavorite) await updateDoc(userDocRef, { favorites: arrayRemove(stationCode) });
      else await updateDoc(userDocRef, { favorites: arrayUnion(stationCode) });
    } catch (error) {
      console.error("즐겨찾기 업데이트 실패:", error);
      Alert.alert("오류", "요청을 처리하는 중 문제가 발생했습니다.");
    }
  };

  // ✅ 훅 사용
  const {
    data: apiData,
    loading: apiLoading,
    error: apiError,
  } = useApiFacilities(stationName, stationCode, line, type);

  const {
    data: localData,
    loading: localLoading,
    error: localError,
  } = useLocalFacilities(stationName, stationCode, line, type);

  // ✅ 데이터 결정 로직
  useEffect(() => {
    let cancelled = false;

    async function decideData() {
      setLoading(true);

      if (type === "EV" || type === "ES") {
        // API 먼저 확인
        if (!apiLoading && apiData && apiData.length > 0) {
          console.log(`✅ ${stationName}: ${apiData.length}개 가져오는 중`);
          if (!cancelled) {
            setFacilities(apiData);
            setUsingLocal(false);
            setErrorMsg("");
          }
        } else if (!apiLoading && (!apiData || apiData.length === 0 || apiError)) {
          // API 실패 → 로컬 fallback
          console.log(`⚠️ ${stationName}: API 데이터 없음 → 로컬로 대체`);
          if (!localLoading && localData) {
            console.log(`📁 ${stationName}: 로컬 ${localData.length}개 불러옴`);
            if (!cancelled) {
              setFacilities(localData);
              setUsingLocal(true);
              setErrorMsg("실시간 데이터를 불러올 수 없어 로컬 데이터를 표시합니다.");
            }
          }
        }
      } else {
        // 나머지는 로컬 JSON만 사용
        if (!localLoading) {
          console.log(`📁 ${stationName}: 로컬 ${localData.length}개 불러옴`);
          if (!cancelled) {
            setFacilities(localData);
            setUsingLocal(true);
            setErrorMsg(localError || "");
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    decideData();
    return () => {
      cancelled = true;
    };
  }, [
    type,
    stationName,
    apiData,
    apiError,
    apiLoading,
    localData,
    localError,
    localLoading,
  ]);

  // ✅ 상단 헤더
  const HeaderMint = useMemo(
    () => (
      <View style={[styles.mintHeader, { paddingTop: insets.top + 6 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={MINT} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22 + fontOffset / 2} color={INK} />
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

  // ✅ UI
  return (
    <SafeAreaView style={styles.container}>
      {HeaderMint}

      {usingLocal && !!errorMsg && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{errorMsg}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>불러오는 중…</Text>
        </View>
      ) : facilities.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>표시할 항목이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={(it, i) => it.id || `${i}`}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title || "시설"}</Text>
                {!!item.desc && <Text style={styles.cardDesc}>{item.desc}</Text>}
              </View>
              <View
                style={[
                  styles.badge2,
                  item.status === "사용가능" || item.status === "정상"
                    ? styles.ok
                    : /중/.test(item.status)
                    ? styles.warn
                    : styles.neutral,
                ]}
              >
                <Text style={styles.badgeText2}>{item.status || "-"}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- 스타일 ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  mintHeader: {
    backgroundColor: MINT,
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: { padding: 6, width: 40, alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  starBtn: { padding: 8 },
  badge: { backgroundColor: "#AEEFED", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: INK, fontWeight: "bold" },
  headerTitle: { color: INK, fontWeight: "bold" },
  banner: {
    backgroundColor: "#FFF4D6",
    borderColor: "#FFE2A8",
    borderWidth: 1,
    margin: 12,
    borderRadius: 10,
    padding: 10,
  },
  bannerText: { color: "#7A5B00", fontWeight: "700" },
  loadingWrap: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16 },
  loadingText: { color: "#333" },
  emptyWrap: { padding: 24, alignItems: "center" },
  emptyText: { color: "#666", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginHorizontal: 12,
  },
  cardTitle: { fontWeight: "bold", color: "#0f172a" },
  cardDesc: { color: "#334155", marginTop: 4 },
  badge2: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  ok: { backgroundColor: "#d4f5f2" },
  warn: { backgroundColor: "#ffe4cc" },
  neutral: { backgroundColor: "#e5e7eb" },
  badgeText2: { fontWeight: "bold", color: "#0f172a" },
});
