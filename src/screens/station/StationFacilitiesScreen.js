import React, { useEffect, useMemo, useState } from "react";
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

// ✅ API: 역 이름으로 요청
import { getEscalatorStatusByName } from "../../api/metroAPI";
// ✅ 로컬 fallback
import { getElevatorsByCode } from "../../api/elevLocal";
import { getEscalatorsForStation } from "../../api/escalatorLocal";

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
  const [items, setItems] = useState(null);
  const [usingLocal, setUsingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    } catch (error) {
      console.error("즐겨찾기 업데이트 실패:", error);
      Alert.alert("오류", "요청을 처리하는 중 오류가 발생했습니다.");
    }
  };

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

  // ✅ 데이터 로드 (역 이름으로 API 호출)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setItems(null);
      setUsingLocal(false);
      setErrorMsg("");

      try {
        console.log("🚀 API 요청:", stationName);
        const all = await getEscalatorStatusByName(stationName);

        const filtered = all.filter((r) => {
          if (type === "EV") return r.type?.toUpperCase() === "EV";
          if (type === "ES") return r.type?.toUpperCase() === "ES";
          return true;
        });

        console.log("✅ API 응답:", filtered.length, "건");

        if (!cancelled && filtered.length > 0) {
          setItems(
            filtered.map((r, idx) => ({
              id: `${r.stationCode || r.STN_CD}-${idx}`,
              title: r.facilityName || (type === "EV" ? "엘리베이터" : "에스컬레이터"),
              desc: [r.section, r.position].filter(Boolean).join(" "),
              status: r.status || "-",
              line: r.line || line,
            }))
          );
          return;
        }

        // ✅ API에 데이터 없으면 로컬 fallback
        let local = [];
        if (type === "EV") {
          local = await getElevatorsByCode(String(stationCode));
        } else if (type === "ES") {
          local = await getEscalatorsForStation(stationName, line);
        }

        if (!cancelled) {
          setUsingLocal(true);
          setItems(local);
          setErrorMsg("API에서 해당 역 정보를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error("실시간 API 오류, 로컬 대체:", err);
        setErrorMsg(err.message || JSON.stringify(err));

        let local = [];
        if (type === "EV") {
          local = await getElevatorsByCode(String(stationCode));
        } else if (type === "ES") {
          local = await getEscalatorsForStation(stationName, line);
        }
        if (!cancelled) {
          setUsingLocal(true);
          setItems(local);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [type, stationCode, stationName, line]);

  return (
    <SafeAreaView style={styles.container}>
      {HeaderMint}

      {usingLocal && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>실시간 데이터를 가져올 수 없어 로컬 데이터로 표시합니다.</Text>
          {!!errorMsg && <Text style={styles.errorText}>({errorMsg})</Text>}
        </View>
      )}

      {items === null ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>불러오는 중…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>표시할 항목이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
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
  errorText: { color: "#B3261E", fontSize: 12, marginTop: 4 },
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
