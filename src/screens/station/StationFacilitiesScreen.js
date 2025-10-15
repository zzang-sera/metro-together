// src/screens/station/StationFacilitiesScreen.js
import React, { useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";

/* ---------------- Types & tiles ---------------- */
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

const MOVE_FACILITIES = [
  { key: TYPES.ELEVATOR,        label: "엘리베이터 위치",     icon: "cube-outline" },
  { key: TYPES.ESCALATOR,       label: "에스컬레이터 위치",   icon: "trending-up-outline" },
  { key: TYPES.WHEELCHAIR_LIFT, label: "휠체어리프트 위치",   icon: "accessibility-outline" },
  { key: TYPES.AUDIO_GUIDE,     label: "음성 유도기 위치",    icon: "volume-high-outline" },
  { key: TYPES.PRIORITY_SEAT,   label: "노약자석 위치",       icon: "people-outline" },
  { key: TYPES.WIDE_GATE,       label: "광폭 개찰구 위치",    icon: "scan-outline" },
];

const CONVENIENCE = [
  { key: TYPES.ACCESSIBLE_TOILET, label: "장애인 화장실 위치", icon: "male-female-outline" },
  { key: TYPES.LOCKER,            label: "물품보관함 위치",     icon: "briefcase-outline" },
  { key: TYPES.NURSING,           label: "수유실 위치",         icon: "medkit-outline" },
];

/* ---------------- screen ---------------- */
export default function StationFacilitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fontOffset } = useFontSize();
  const insets = useSafeAreaInsets();

  // 상단에서 넘어온 파라미터
  const { stationCode = "", stationName = "", line = "" } = route.params || {};

  /* ------------ header ------------- */
  const HeaderMint = useMemo(() => (
    <View style={[styles.mintHeader, { paddingTop: insets.top + 6 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.headerBtn}
        accessibilityLabel="뒤로가기"
      >
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

      <View style={[styles.headerRight, { flexDirection: "row" }]}>
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
  ), [navigation, stationName, line, fontOffset, insets.top, stationCode]);

  /* ------------ grid card ------------- */
  const IconCard = ({ item }) => (
    <TouchableOpacity
      style={styles.iconCard}
      onPress={() => navigation.navigate("FacilityType", { stationCode, stationName, line, type: item.key })}
      accessibilityLabel={`${item.label}로 이동`}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={28 + fontOffset} color={INK} />
      </View>
      <Text style={[styles.iconLabel, { fontSize: responsiveFontSize(12) + fontOffset }]}>{item.label}</Text>
    </TouchableOpacity>
  );

  /* ---------------- render ---------------- */
  return (
    <SafeAreaView style={styles.container}>
      {HeaderMint}

      {/* 화면 전체는 하나의 스크롤러(부모 ScrollView가 스크롤 담당) */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={styles.content}>
          <View style={styles.sectionBox}>
            <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(14) + fontOffset }]}>
              이동시설
            </Text>
            <FlatList
              data={MOVE_FACILITIES}
              keyExtractor={(i) => i.key}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => <IconCard item={item} />}
              scrollEnabled={false}   // 부모 ScrollView가 스크롤 담당
            />
          </View>

          <View style={styles.sectionBox}>
            <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(14) + fontOffset }]}>
              편의시설
            </Text>
            <FlatList
              data={CONVENIENCE}
              keyExtractor={(i) => i.key}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => <IconCard item={item} />}
              scrollEnabled={false}   // 부모 ScrollView가 스크롤 담당
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const MINT = "#21C9C6";
const INK = "#003F40";
const BG = "#F9F9F9";
const CARD_BG = "#E6FBFB";
const FRAME_BG = "#F3F7F7";

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
  headerRight: { alignItems: "center", justifyContent: "flex-start", gap: 6, minWidth: 84 },
  switchBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#D7F3F2",
  },
  switchBtnText: { color: INK, fontWeight: "bold" },
  badge: { backgroundColor: "#AEEFED", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 4 },
  badgeText: { color: INK, fontWeight: "bold" },
  headerTitle: { color: INK, fontWeight: "bold" },

  content: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
  sectionBox: { backgroundColor: FRAME_BG, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, marginBottom: 12 },
  sectionTitle: { color: INK, fontWeight: "bold", marginBottom: 8 },
  gridContent: { paddingHorizontal: 2 },
  gridRow: { gap: 12, marginBottom: 12 },
  iconCard: { flex: 1, alignItems: "center" },
  iconCircle: { width: 84, height: 84, borderRadius: 18, backgroundColor: CARD_BG, justifyContent: "center", alignItems: "center" },
  iconLabel: { marginTop: 6, textAlign: "center", color: INK, fontWeight: "bold" },
});
