// src/screens/station/FacilityTypeScreen.js

import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { getElevatorsByCode } from "../../api/elevLocal";
import Constants from "expo-constants";

// 역 좌표 JSON (Y: lat, X: lng)
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";
const STATIONS = stationJson?.DATA || [];

/** ─────────────────────────────────────────────────────────
 * 1) 지도 공급자 안전 로딩 (네이티브 → WebView → 안내)
 *    - 네이티브가 있으면 그걸 사용
 *    - 없으면 WebView로 Naver JS API
 *    - 둘 다 없으면 안내 박스
 * ───────────────────────────────────────────────────────── */

let NaverMapPkg = null; // { default: NaverMapView, Marker }
try {
  // 설치되어 있고 네이티브 빌드가 되어있다면 객체가 들어옵니다.
  NaverMapPkg = require("@mj-studio/react-native-naver-map");
  // console.log('[CHK] Naver native map available =', !!NaverMapPkg?.default);
} catch (_) {
  NaverMapPkg = null;
}

let WebViewComp = null;
try {
  WebViewComp = require("react-native-webview").WebView;
  // console.log('[CHK] WebView available =', !!WebViewComp);
} catch (_) {
  WebViewComp = null;
}

/* 타입 키 & 라벨/아이콘 매핑 */
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

const TYPE_META = {
  [TYPES.ELEVATOR]:         { label: "엘리베이터",     icon: "cube-outline" },
  [TYPES.ESCALATOR]:        { label: "에스컬레이터",   icon: "trending-up-outline" },
  [TYPES.ACCESSIBLE_TOILET]:{ label: "장애인 화장실",   icon: "male-female-outline" },
  [TYPES.WHEELCHAIR_LIFT]:  { label: "휠체어리프트",   icon: "accessibility-outline" },
  [TYPES.WIDE_GATE]:        { label: "광폭 개찰구",     icon: "scan-outline" },
  [TYPES.NURSING]:          { label: "수유실",         icon: "medkit-outline" },
  [TYPES.LOCKER]:           { label: "물품보관함",     icon: "briefcase-outline" },
  [TYPES.AUDIO_GUIDE]:      { label: "음성 유도기",     icon: "volume-high-outline" },
  [TYPES.PRIORITY_SEAT]:    { label: "노약자석",       icon: "people-outline" },
};

// app.json → extra에서 가져오면 배포/교체가 편함
const NAVER_CLIENT_ID =
  Constants?.expoConfig?.extra?.EXPO_PUBLIC_NAVER_CLIENT_ID ?? "YOUR_NCP_CLIENT_ID";

export default function FacilityTypeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();

  const { stationCode = "", stationName = "", line = "", type = TYPES.ELEVATOR } = route.params || {};
  const meta = useMemo(
    () => TYPE_META[type] || { label: "편의시설", icon: "information-circle-outline" },
    [type]
  );

  // 역 좌표
  const stationMeta = useMemo(() => {
    if (!stationCode) return null;
    return STATIONS.find((s) => String(s.STATION_CD) === String(stationCode)) || null;
  }, [stationCode]);

  const coord = useMemo(() => {
    const lat = Number(stationMeta?.Y);
    const lng = Number(stationMeta?.X);
    const valid = Number.isFinite(lat) && Number.isFinite(lng);
    return valid
      ? { latitude: lat, longitude: lng }
      : { latitude: 37.5665, longitude: 126.9780 }; // 서울시청
  }, [stationMeta]);

  // 데이터 (엘리베이터만 실제 API)
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let data = [];
        if (type === TYPES.ELEVATOR) data = (await getElevatorsByCode(String(stationCode))) || [];
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [type, stationCode]);

  // WebView용 HTML (네이티브가 없을 때만 사용)
  const html = useMemo(() => {
    if (!WebViewComp) return "";
    const { latitude, longitude } = coord;
    const safeName = (stationName || "역").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin:0; padding:0; height:100%; }
  #map { width:100%; height:100%; }
  .caption {
    position:absolute; top:8px; left:8px; background:rgba(255,255,255,.9);
    padding:6px 8px; border-radius:8px; font-family: -apple-system, Roboto, 'Noto Sans KR', sans-serif; font-size:12px;
    box-shadow:0 2px 6px rgba(0,0,0,.1);
  }
</style>
<script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}"></script>
</head>
<body>
<div id="map"></div>
<div class="caption">${safeName}</div>
<script>
  (function() {
    var center = new naver.maps.LatLng(${latitude}, ${longitude});
    var map = new naver.maps.Map('map', {
      center: center,
      zoom: 15,
      mapDataControl: false,
      scaleControl: true,
      logoControl: false
    });
    var marker = new naver.maps.Marker({ position: center, map: map });
  })();
</script>
</body>
</html>`;
  }, [coord, stationName]);

  // 현재 사용 가능한 지도 공급자 결정
  const MAP_PROVIDER =
    NaverMapPkg?.default
      ? "native"
      : (WebViewComp ? "webview" : "none");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityLabel="뒤로가기">
          <Ionicons name="chevron-back" size={22 + fontOffset / 2} color={INK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>{line || "?"}</Text>
          </View>
          <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>{stationName || "역명"}</Text>
          <View style={styles.typeRow}>
            <Ionicons name={meta.icon} size={16} color="#0a7b7a" style={{ marginRight: 6 }} />
            <Text style={[styles.typeText, { fontSize: responsiveFontSize(12) + fontOffset * 0.2 }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* 내용 */}
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        {/* 지도 */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            역 위치 {MAP_PROVIDER === "native" ? "(Naver Map SDK)" : MAP_PROVIDER === "webview" ? "(Naver JS API)" : ""}
          </Text>

          <View style={styles.mapWrap}>
            {MAP_PROVIDER === "native" ? (
              // ✅ 네이티브 네이버맵 (정의가 보장될 때만 렌더)
              (() => {
                const NaverMapView = NaverMapPkg.default;
                const Marker = NaverMapPkg.Marker;
                return (
                  <NaverMapView
                    style={styles.map}
                    center={{ latitude: coord.latitude, longitude: coord.longitude, zoom: 15 }}
                    showsMyLocationButton={false}
                    scaleBar={true}
                    compass={false}
                  >
                    <Marker coordinate={{ latitude: coord.latitude, longitude: coord.longitude }} />
                  </NaverMapView>
                );
              })()
            ) : MAP_PROVIDER === "webview" ? (
              // ✅ WebView (정의가 보장될 때만 렌더)
              <WebViewComp
                originWhitelist={["*"]}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
                style={styles.map}
              />
            ) : (
              // ✅ 둘 다 없을 때만 안내
              <View style={[styles.map, styles.centerBox]}>
                <Ionicons name="information-circle-outline" size={18} color="#888" />
                <Text style={{ marginTop: 6, color: "#666", textAlign: "center" }}>
                  지도 모듈이 설치되어 있지 않습니다.{"\n"}
                  @mj-studio/react-native-naver-map 또는 react-native-webview 설정을 확인하세요.
                </Text>
              </View>
            )}
          </View>

          {!stationMeta && (
            <Text style={styles.helpText}>좌표가 없어 기본 위치(서울시청)로 표시했습니다.</Text>
          )}
        </View>

        {/* 데이터 */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>{meta.label} 목록</Text>
          <Text style={styles.desc}>
            {type === TYPES.ELEVATOR ? "역 내 엘리베이터 정보를 보여줍니다." : "해당 타입은 API 연결 전(예시 레이아웃)."}
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8, color: "#666" }}>불러오는 중…</Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="information-circle-outline" size={18} color="#888" />
              <Text style={{ marginTop: 6, color: "#666" }}>표시할 항목이 없습니다.</Text>
            </View>
          ) : (
            rows.map((row, idx) => (
              <View key={`${row?.ELEV_ID || idx}`} style={styles.item}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="cube-outline" size={16} color="#0a7b7a" style={{ marginRight: 8 }} />
                  <Text style={styles.itemTitle}>{row?.ELEV_NM || `엘리베이터 #${idx + 1}`}</Text>
                </View>
                {!!row?.ELEV_LOC && <Text style={styles.itemSub}>{row.ELEV_LOC}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* 색상 */
const MINT = "#21C9C6";
const INK  = "#003F40";
const BG   = "#F9F9F9";

/* 스타일 */
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
  headerRight: { minWidth: 36 },
  typeRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  typeText: { color: "#0a7b7a", fontWeight: "bold" },

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
  cardTitle: { color: "#1f2937", fontWeight: "bold" },
  desc: { marginTop: 6, color: "#666" },

  mapWrap: { height: 220, borderRadius: 12, overflow: "hidden", marginTop: 8 },
  map: { width: "100%", height: "100%", backgroundColor: "#eee" },
  centerBox: { alignItems: "center", justifyContent: "center" },

  helpText: { marginTop: 8, color: "#666", fontSize: 12 },
  loadingBox: { alignItems: "center", paddingVertical: 16 },
  emptyBox: { alignItems: "center", paddingVertical: 16 },

  item: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6ECEB",
    marginTop: 8,
  },
  itemTitle: { color: "#0a7b7a", fontWeight: "bold" },
  itemSub: { marginTop: 4, color: "#445655" },
});
