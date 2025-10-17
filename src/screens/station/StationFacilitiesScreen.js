import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, StatusBar, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

// ✅ Supabase Edge Function (실시간)
import { getEscalatorStatusByName } from "../../api/metroAPI";

// ✅ 로컬 데이터 (fallback)
import { getElevByName, prettify as prettifyElev } from "../../api/elevLocal";
import { getEscalatorsByName, prettifyEsc } from "../../api/escalatorLocal";

const MINT = "#21C9C6";
const INK  = "#003F40";
const BG   = "#F9F9F9";

export default function StationFacilitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();

  const { stationCode = "", stationName = "", line = "", type } = route.params || {};

  const [isFavorite, setIsFavorite] = useState(false);
  const [items, setItems] = useState(null);
  const [isOfflineData, setIsOfflineData] = useState(false); // ✅ 로컬 fallback 여부 표시

  const currentUser = auth.currentUser;

  // 즐겨찾기 상태 구독
  useEffect(() => {
    if (!currentUser || !stationCode) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) setIsFavorite(snap.data().favorites?.includes(stationCode));
    });
    return () => unsub();
  }, [currentUser, stationCode]);

  const handleFavoriteToggle = async () => {
    if (!currentUser || !stationCode) {
      Alert.alert("로그인 필요", "즐겨찾기 기능은 로그인 후 이용할 수 있습니다.");
      return;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      if (isFavorite) await updateDoc(userDocRef, { favorites: arrayRemove(stationCode) });
      else await updateDoc(userDocRef, { favorites: arrayUnion(stationCode) });
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "요청 처리 중 문제가 발생했습니다.");
    }
  };

  const Header = useMemo(() => (
    <View style={[styles.mintHeader, { paddingTop: insets.top + 6 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityLabel="뒤로가기">
        <Ionicons name="chevron-back" size={22 + fontOffset / 2} color={INK} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
          {stationName}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={handleFavoriteToggle} style={styles.starBtn} accessibilityLabel="즐겨찾기">
          <Ionicons
            name={isFavorite ? "star" : "star-outline"}
            size={24 + fontOffset / 2}
            color={isFavorite ? "#FFD700" : INK}
          />
        </TouchableOpacity>
      </View>
    </View>
  ), [navigation, stationName, fontOffset, insets.top, isFavorite]);

  // ✅ 핵심: API 우선 → 빈 결과/오류 시 로컬 fallback
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setItems(null);
      setIsOfflineData(false);

      try {
        // 1) 실시간 API (Supabase Edge Function) 우선
        const apiData = await getEscalatorStatusByName(stationName);
        let finalList = Array.isArray(apiData) ? apiData : [];

        if (finalList.length > 0) {
          // API 결과 매핑
          finalList = finalList.map((r, idx) => ({
            id: `${r.stationCode ?? stationCode}-api-${idx}`,
            title: r.facilityName || "승강기",
            desc: [r.section, r.position].filter(Boolean).join(" · "),
            status: r.status || "-",         // "사용가능" / "중지" 등
            line: r.line || line,
            type: r.type,                    // EV / ES / WL ...
          }));
        } else {
          // 2) API에 해당 역 없음 → 로컬 fallback
          setIsOfflineData(true);
          const elevs = prettifyElev(await getElevByName(stationName));
          const escs  = prettifyEsc(await getEscalatorsByName(stationName), line);
          finalList = [...elevs, ...escs].map((r, i) => ({
            id: `${stationCode}-local-${i}`,
            title: r.facilityName || r.title || "승강기",
            desc: [r.section, r.gate || r.position].filter(Boolean).join(" · "),
            status: r.status || "정보없음",
            line: r.line || line,
          }));
        }

        if (!cancelled) setItems(finalList);
      } catch (err) {
        // 3) 네트워크/서버 오류 → 로컬 fallback
        console.error("실시간 API 오류, 로컬 대체:", err);
        setIsOfflineData(true);
        const elevs = prettifyElev(await getElevByName(stationName));
        const escs  = prettifyEsc(await getEscalatorsByName(stationName), line);
        const all = [...elevs, ...escs].map((r, i) => ({
          id: `${stationCode}-local-${i}`,
          title: r.facilityName || r.title || "승강기",
          desc: [r.section, r.gate || r.position].filter(Boolean).join(" · "),
          status: r.status || "정보없음",
          line: r.line || line,
        }));
        if (!cancelled) setItems(all);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stationName, stationCode, line]);

  return (
    <SafeAreaView style={styles.container}>
      {Header}

      {isOfflineData && (
        <View style={styles.alertBox} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
          <Text style={styles.alertText}>실시간 사용 가능 여부를 알 수 없는 역입니다.</Text>
        </View>
      )}

      {!items ? (
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
                {!!item.line && <Text style={styles.cardMeta}>라인: {item.line}</Text>}
              </View>
              <View style={[
                styles.badge2,
                item.status === "사용가능" || item.status === "정상"
                  ? styles.ok
                  : /중/.test(item.status)
                  ? styles.warn
                  : styles.neutral,
              ]}>
                <Text style={styles.badgeText2}>{item.status}</Text>
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerRight: { width: 48, alignItems: "center" },
  starBtn: { padding: 8 },
  headerTitle: { color: INK, fontWeight: "bold" },

  alertBox: {
    backgroundColor: "#fef3c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  alertText: { color: "#78350f", fontWeight: "bold" },

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
  cardMeta: { color: "#475569", marginTop: 2 },
  badge2: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  ok: { backgroundColor: "#d4f5f2" },
  warn: { backgroundColor: "#ffe4cc" },
  neutral: { backgroundColor: "#e5e7eb" },
  badgeText2: { fontWeight: "bold", color: "#0f172a" },
});
