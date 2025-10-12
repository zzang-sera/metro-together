import React, { useMemo, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { getElevatorsByCode } from "../../api/elevLocal";

// [추가] Firebase 관련 모듈 import (사용자님의 파일 경로에 맞춰주세요)
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from "../../config/firebaseConfig"; // firebaseConfig.js 에서 가져오도록 수정

// 타입 키
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

export default function StationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();

  // [추가] 즐겨찾기 상태 관리를 위한 state 및 현재 사용자 정보
  const [isFavorite, setIsFavorite] = useState(false);
  const currentUser = auth.currentUser;

  const { stationCode = "", stationName = "", line = "", distanceKm = null, phone = "" } =
    route.params || {};

  // [추가] 즐겨찾기 상태 실시간 동기화 Effect
  useEffect(() => {
    if (!currentUser || !stationCode) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setIsFavorite(userData.favorites?.includes(stationCode));
      }
    });

    return () => unsubscribe();
  }, [currentUser, stationCode]);

  useEffect(() => {
    console.log("[NAV] StationDetail mounted", { stationCode, stationName, line });
  }, [stationCode, stationName, line]);

  const [elevCount, setElevCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = (await getElevatorsByCode(String(stationCode))) || [];
      if (!cancelled) setElevCount(rows.length);
    })();
    return () => { cancelled = true; };
  }, [stationCode]);

  // [추가] 즐겨찾기 추가/삭제를 처리하는 함수
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

  // 헤더
  const Header = useMemo(() => (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityLabel="뒤로가기">
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

      <View style={styles.headerRight}>
        {/* [수정] 즐겨찾기 버튼에 로직 연동 */}
        <TouchableOpacity 
          onPress={handleFavoriteToggle} 
          accessibilityLabel="즐겨찾기" 
          style={styles.starBtn}
        >
          <Ionicons 
            name={isFavorite ? "star" : "star-outline"} 
            size={24 + fontOffset / 2} // 아이콘 크기 약간 증가
            color={isFavorite ? "#FFD700" : INK} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => navigation.navigate("StationFacilities", { stationCode, stationName, line })}
          accessibilityLabel="간단히 보기"
        >
          <Text style={[styles.quickBtnText, { fontSize: responsiveFontSize(11) + fontOffset * 0.6 }]}>
            간단히 보기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [navigation, stationName, line, fontOffset, insets.top, stationCode, isFavorite]); // [수정] isFavorite를 의존성 배열에 추가

  const goList = (type) => {
    navigation.navigate("StationFacilities", { stationCode, stationName, line, type });
  };

  const Chip = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={16} color="#0a7b7a" style={{ marginRight: 6 }} />
      <Text style={[styles.chipText, { fontSize: responsiveFontSize(12) + fontOffset * 0.2 }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {Header}

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.linePill}><Text style={styles.linePillText}>{line}</Text></View>
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>{stationName}</Text>
            {/* [삭제] 카드 내부에 있던 중복 즐겨찾기 버튼 삭제 */}
          </View>

          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color="#5b6b6a" />
            <Text style={[styles.rowText, { fontSize: responsiveFontSize(13) + fontOffset * 0.2 }]}>
              {phone || "02 - XXXX - XXXX"}
            </Text>
          </View>

          {/* 이하 나머지 UI는 기존과 동일 */}
          <View style={styles.chipsWrap}>
            <Chip icon="cube-outline"            label={`엘리베이터 ${elevCount}대`} onPress={() => goList(TYPES.ELEVATOR)} />
            <Chip icon="trending-up-outline"     label="에스컬레이터"               onPress={() => goList(TYPES.ESCALATOR)} />
            <Chip icon="volume-high-outline"     label="음성 유도기"                 onPress={() => goList(TYPES.AUDIO_GUIDE)} />
          </View>
          <View style={styles.chipsWrap}>
            <Chip icon="accessibility-outline"   label="휠체어리프트"                 onPress={() => goList(TYPES.WHEELCHAIR_LIFT)} />
            <Chip icon="people-outline"          label="노약자석"                     onPress={() => goList(TYPES.PRIORITY_SEAT)} />
            <Chip icon="scan-outline"            label="광폭 개찰구"                   onPress={() => goList(TYPES.WIDE_GATE)} />
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Ionicons name="navigate-outline" size={16} color="#5b6b6a" />
            <Text style={[styles.rowText, { fontSize: responsiveFontSize(13) + fontOffset * 0.2 }]}>
              {distanceKm != null ? `${distanceKm} km` : "거리 정보 없음"}
            </Text>
            <TouchableOpacity style={{ marginLeft: "auto" }} onPress={() => goList(TYPES.ELEVATOR)}>
              <Text style={[styles.link, { fontSize: responsiveFontSize(12) + fontOffset * 0.2 }]}>자세히 보기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>편의시설</Text>
          </View>
          <View style={styles.chipsWrap}>
            <Chip icon="male-female-outline"     label="장애인 화장실" onPress={() => goList(TYPES.ACCESSIBLE_TOILET)} />
            <Chip icon="briefcase-outline"       label="물품보관함"     onPress={() => goList(TYPES.LOCKER)} />
            <Chip icon="medkit-outline"          label="수유실"         onPress={() => goList(TYPES.NURSING)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const MINT = "#21C9C6";
const INK  = "#003F40";
const BG   = "#F9F9F9";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: MINT,
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: { padding: 6, minWidth: 36, alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: INK, fontWeight: "bold" },
  badge: { backgroundColor: "#AEEFED", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 4 },
  badgeText: { color: INK, fontWeight: "bold" },
  // [수정] 오른쪽 버튼 그룹 스타일: 간격(gap)을 늘려 버튼 사이 여유 공간 확보
  headerRight: { flexDirection: 'row', alignItems: "center", justifyContent: "flex-end", gap: 12, minWidth: 90 },
  // [수정] 즐겨찾기 버튼 터치 영역 확대
  starBtn: { padding: 8 },
  quickBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "#ffffff",
    borderRadius: 12, borderWidth: 1, borderColor: "#D7F3F2",
  },
  quickBtnText: { color: INK, fontWeight: "bold" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6ECEB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  linePill: { backgroundColor: "#e8fbfa", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  linePillText: { color: INK, fontWeight: "bold", fontSize: 12 },
  cardTitle: { color: "#1f2937", fontWeight: "bold", flex: 1 }, // [수정] flex:1 추가하여 공간 차지
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  rowText: { color: "#445655", fontWeight: "bold" },
  link: { color: "#0a7b7a", fontWeight: "bold" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e6fbfb",
    borderWidth: 1,
    borderColor: "#D7F3F2",
  },
  chipText: { color: "#0a7b7a", fontWeight: "bold" },
});