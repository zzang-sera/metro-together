//src/screens/station/StationFacilitiesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { getElevatorsByCode } from "../../api/elevLocal";
import { getEscalatorsForStation } from "../../api/escalatorLocal";
import { getAudioBeaconsForStation } from "../../api/voiceLocal";
import { getWheelchairLiftsForStation } from "../../api/wheelchairLiftLocal";
import { getLockersForStation } from "../../api/lockerLocal";
import { getNursingRoomsForStation } from "../../api/nursingRoomLocal";

// 타입 키(요구 사양)
const TYPES = {
  ELEVATOR: "elevator",
  ESCALATOR: "escalator",
  ACCESSIBLE_TOILET: "accessible_toilet",
  WHEELCHAIR_LIFT: "wheelchair_lift",
  WIDE_GATE: "wide_gate",
  NURSING: "nursing_room",
  LOCKER: "locker",
  AUDIO_GUIDE: "audio_beacon",
  PRIORITY_SEAT: "priority_seat",
};

// 이동시설 / 편의시설 아이콘 정의
const MOVE_FACILITIES = [
  { key: TYPES.ELEVATOR,        label: "엘리베이터 위치",   icon: "cube-outline" },
  { key: TYPES.ESCALATOR,       label: "에스컬레이터 위치", icon: "trending-up-outline" },
  { key: TYPES.WHEELCHAIR_LIFT, label: "휠체어리프트 위치", icon: "accessibility-outline" },
  { key: TYPES.AUDIO_GUIDE,     label: "음성 유도기 위치",  icon: "volume-high-outline" },
  { key: TYPES.PRIORITY_SEAT,   label: "노약자석 위치",     icon: "people-outline" },
  { key: TYPES.WIDE_GATE,       label: "광폭 개찰구 위치",  icon: "scan-outline" },
];

const CONVENIENCE = [
  { key: TYPES.ACCESSIBLE_TOILET, label: "장애인 화장실 위치", icon: "male-female-outline" },
  { key: TYPES.LOCKER,            label: "물품보관함 위치",     icon: "briefcase-outline" },
  { key: TYPES.NURSING,           label: "수유실 위치",         icon: "medkit-outline" },
];

// 임시 데이터(아직 연동 안 된 타입)
const mockItems = (n, label) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${label}-${i + 1}`,
    title: `${label} #${i + 1}`,
    desc: "세부 정보는 추후 연결",
    status: Math.random() > 0.2 ? "정상" : "점검중",
  }));

// type 값 정규화(별칭/오타 흡수)
const normalizeType = (t) => {
  const s = String(t || "").trim().toLowerCase();
  if (["elevator"].includes(s)) return TYPES.ELEVATOR;
  if (["escalator"].includes(s)) return TYPES.ESCALATOR;
  if (["audio_beacon", "audio_guide", "audio-guide", "audioguide", "audio", "beacon"].includes(s))
    return TYPES.AUDIO_GUIDE;
  if (["accessible_toilet", "toilet", "wc"].includes(s)) return TYPES.ACCESSIBLE_TOILET;
  if (["wheelchair_lift", "lift"].includes(s)) return TYPES.WHEELCHAIR_LIFT;
  if (["wide_gate", "widegate"].includes(s)) return TYPES.WIDE_GATE;
  if (["nursing_room", "nursing"].includes(s)) return TYPES.NURSING;
  if (["locker", "storage"].includes(s)) return TYPES.LOCKER;
  if (["priority_seat", "priority"].includes(s)) return TYPES.PRIORITY_SEAT;
  return s;
};

export default function StationFacilitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fontOffset } = useFontSize();
  const insets = useSafeAreaInsets();

  // params: stationCode, stationName, line, type?(없으면 그리드)
  const { stationCode = "", stationName = "", line = "", type } = route.params || {};
  const normType = useMemo(() => normalizeType(type), [type]);

  useEffect(() => {
    console.log("[NAV] StationFacilities mounted", { stationCode, stationName, line, type, normType });
  }, [stationCode, stationName, line, type, normType]);

  // ----------------- 상단 민트 배너 -----------------
  const HeaderMint = useMemo(
    () => (
      <View style={[styles.mintHeader, { paddingTop: insets.top + 6 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={MINT} />

        {/* 뒤로가기 */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          accessibilityLabel="뒤로가기"
        >
          <Ionicons name="chevron-back" size={22 + fontOffset / 2} color={INK} />
        </TouchableOpacity>

        {/* 중앙: 라인 뱃지 + 역명 */}
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

        {/* 오른쪽: 즐겨찾기 + 자세히 보기(=StationDetail로 전환) */}
        <View style={styles.headerRight}>
          <TouchableOpacity accessibilityLabel="즐겨찾기" style={styles.starBtn}>
            <Ionicons name="star-outline" size={20 + fontOffset / 2} color={INK} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => navigation.navigate("StationDetail", { stationCode, stationName, line })}
            accessibilityLabel="자세히 보기"
          >
            <Text style={[styles.switchBtnText, { fontSize: responsiveFontSize(11) + fontOffset * 0.6 }]}>
              자세히 보기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [navigation, stationName, line, fontOffset, insets.top, stationCode]
  );

  // ----------------- 그리드 모드 (type 없음) -----------------
  const IconCard = ({ item }) => (
    <TouchableOpacity
      style={styles.iconCard}
      onPress={() => {
        // 아이콘 탭 → 동일 화면을 리스트 모드로 전환(type 설정)
        navigation.navigate("StationFacilities", { stationCode, stationName, line, type: item.key });
      }}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={28 + fontOffset} color={INK} />
      </View>
      <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(12) + fontOffset }]}>{item.label}</Text>
    </TouchableOpacity>
  );

  // ----------------- 리스트 모드 (type 있음) -----------------
  const [items, setItems] = useState(null); // null=로딩, []=빈 목록, object[]=데이터

  const typeLabel = useMemo(() => {
    const map = {
      [TYPES.ELEVATOR]: "엘리베이터",
      [TYPES.ESCALATOR]: "에스컬레이터",
      [TYPES.WHEELCHAIR_LIFT]: "휠체어리프트",
      [TYPES.AUDIO_GUIDE]: "음성 유도기",
      [TYPES.PRIORITY_SEAT]: "노약자석",
      [TYPES.WIDE_GATE]: "광폭 개찰구",
      [TYPES.ACCESSIBLE_TOILET]: "장애인 화장실",
      [TYPES.LOCKER]: "물품보관함",
      [TYPES.NURSING]: "수유실",
    };
    return map[normType] || "시설";
  }, [normType]);

  useEffect(() => {
    if (!normType) return; // 그리드 모드일 때는 로드하지 않음
    let cancelled = false;

    async function load() {
      setItems(null);

      // 로더 맵으로 분기 실수 방지
      const loaders = {
        [TYPES.ELEVATOR]: async () => {
          const rows = (await getElevatorsByCode(String(stationCode))) || [];
          return rows.map((r, idx) => ({
            id: `${r.stationCode}-${idx}`,
            title: r.name || r.position || "엘리베이터",
            desc: `${r.section || ""} ${r.position || ""}`.trim(),
            status: r.status === "Y" ? "사용가능" : r.status === "N" ? "중지" : r.status || "-",
            line: r.line || line,
          }));
        },
        [TYPES.ESCALATOR]: async () => getEscalatorsForStation(stationName, line),
        [TYPES.AUDIO_GUIDE]: async () => getAudioBeaconsForStation(stationName, line, stationCode),
        [TYPES.WHEELCHAIR_LIFT]: async () => getWheelchairLiftsForStation(stationName, line),
        [TYPES.LOCKER]: async () => getLockersForStation(stationName, line),
        [TYPES.NURSING]: async () => getNursingRoomsForStation(stationName, line),
      };

      const fn = loaders[normType];
      if (fn) {
        const mapped = await fn();
        if (!cancelled) setItems(mapped);
      } else {
        // 아직 연동 안 된 타입은 임시 표기
        const count = normType === TYPES.ACCESSIBLE_TOILET ? 2 : 5;
        if (!cancelled) setItems(mockItems(count, typeLabel));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [normType, stationCode, stationName, line, typeLabel]);

  // ----------------- 렌더 -----------------
  return (
    <SafeAreaView style={styles.container}>
      {HeaderMint}

      {!normType ? (
        <View style={styles.content}>
          <View style={styles.sectionBox}>
            <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(14) + fontOffset }]}>이동시설</Text>
            <FlatList
              data={MOVE_FACILITIES}
              keyExtractor={(i) => i.key}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => <IconCard item={item} />}
            />
          </View>

          <View style={styles.sectionBox}>
            <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(14) + fontOffset }]}>편의시설</Text>
            <FlatList
              data={CONVENIENCE}
              keyExtractor={(i) => i.key}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => <IconCard item={item} />}
            />
          </View>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>{typeLabel} 목록</Text>
            <Text style={[styles.listSub, { fontSize: responsiveFontSize(12) + fontOffset }]}>
              코드: {stationCode || "-"} · {line}
            </Text>
          </View>

          {items === null ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator />
              <Text style={[styles.loadingText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
                불러오는 중…
              </Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { fontSize: responsiveFontSize(14) + fontOffset }]}>
                표시할 항목이 없어요
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                      {item.title}
                    </Text>
                    {!!item.desc && (
                      <Text style={[styles.cardDesc, { fontSize: responsiveFontSize(12) + fontOffset }]}>
                        {item.desc}
                      </Text>
                    )}
                    {!!item.line && (
                      <Text style={[styles.cardMeta, { fontSize: responsiveFontSize(12) + fontOffset }]}>
                        라인: {item.line}
                      </Text>
                    )}
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
                    <Text style={[styles.badgeText2, { fontSize: responsiveFontSize(12) + fontOffset }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

/* --- 색상 토큰 --- */
const MINT = "#21C9C6";
const INK = "#003F40";
const BG = "#F9F9F9";
const CARD_BG = "#E6FBFB";
const FRAME_BG = "#F3F7F7";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // 상단 민트 배너
  mintHeader: {
    backgroundColor: MINT,
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: { padding: 6, width: 40, alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerRight: { alignItems: "center", justifyContent: "flex-start", gap: 6, minWidth: 84 },
  starBtn: { padding: 6 },
  switchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7F3F2",
  },
  switchBtnText: { color: INK, fontWeight: "bold" },

  badge: {
    backgroundColor: "#AEEFED",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  badgeText: { color: INK, fontWeight: "bold" },
  headerTitle: { color: INK, fontWeight: "bold" },

  // 그리드 공통
  content: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
  sectionBox: {
    backgroundColor: FRAME_BG,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  sectionTitle: { color: INK, fontWeight: "bold", marginBottom: 8 },
  gridContent: { paddingHorizontal: 2 },
  gridRow: { gap: 12, marginBottom: 12 },
  iconCard: { flex: 1, alignItems: "center" },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  iconLabel: { marginTop: 6, textAlign: "center", color: INK, fontWeight: "bold" },

  // 리스트 모드
  listWrap: { flex: 1 },
  listHeader: { paddingHorizontal: 12, paddingTop: 12 },
  listTitle: { fontWeight: "bold", color: "#17171B" },
  listSub: { color: "#6B7280", marginTop: 4, fontWeight: "bold" },
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
