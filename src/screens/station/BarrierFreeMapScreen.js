import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import elevatorSeoulStation from "../../assets/metro-data/metro/elevator/elevator_seoulstation.json";
import escalatorData from "../../assets/metro-data/metro/escalator/서울시 지하철 출입구 리프트 위치정보.json";

const NAVER_MAP_KEY = "1stxzdmhn9";
const BASE_URL = "http://192.168.219.107:8081";
const MINT = "#21C9C6";
const INK = "#003F40";

// ✅ 괄호 제거 포함 정규화 함수
const norm = (t) =>
  String(t || "")
    .replace(/\(.+?\)/g, "") // 괄호 속 숫자 제거 ex) 서울역(1) → 서울역
    .replace(/\s|역/g, "")   // 공백·'역' 제거
    .toLowerCase();

const inKorea = (lat, lng) =>
  lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;

function parseWKT(pointString) {
  if (!pointString) return null;
  const m = pointString.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const lng = parseFloat(m[1]);
  const lat = parseFloat(m[2]);
  if (!inKorea(lat, lng)) return null;
  return { lat, lng };
}

export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const webRef = useRef(null);
  const { width } = useWindowDimensions();

  const { stationName = "서울", line = "1호선", type = "ALL" } = route.params || {};

  // ─────────────── 엘리베이터 ───────────────
  const allEV = elevatorSeoulStation?.DATA || [];
  const filteredEV = allEV.filter(
    (n) => norm(n.sbwy_stn_nm || n.SBWY_STN_NM) === norm(stationName)
  );
  const pointsEV = filteredEV
    .map((n) => {
      const p = parseWKT(n.node_wkt || n.NODE_WKT);
      return p ? { ...p, type: "EV", title: "엘리베이터" } : null;
    })
    .filter(Boolean);

  // ─────────────── 에스컬레이터 ───────────────
  const allES = escalatorData?.DATA || [];
  const filteredES = allES.filter(
    (n) => norm(n.sbwy_stn_nm || n.SBWY_STN_NM) === norm(stationName)
  );
  const pointsES = filteredES
    .map((n) => {
      const p = parseWKT(n.node_wkt || n.NODE_WKT);
      return p ? { ...p, type: "ES", title: "에스컬레이터/리프트" } : null;
    })
    .filter(Boolean);

  // ─────────────── 지도 표시 대상 ───────────────
  let allPoints = [];
  if (type === "EV") allPoints = pointsEV;
  else if (type === "ES") allPoints = pointsES;
  else allPoints = [...pointsEV, ...pointsES];

  const baseLat =
    allPoints.length > 0
      ? allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length
      : 37.5665;
  const baseLng =
    allPoints.length > 0
      ? allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length
      : 126.9780;

  console.log(`📍 [${stationName}] EV=${pointsEV.length}, ES=${pointsES.length}`);

  // ─────────────── HTML 지도 코드 ───────────────
  const html = useMemo(
    () => `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no" />
        <style>
          html, body { margin:0; padding:0; height:100%; background:#e8fdfc; }
          #map { width:100vw; height:100vh; }
          .dot { width:12px; height:12px; border-radius:50%; border:2px solid #fff; }
          .label { background:rgba(0,0,0,0.6); color:#fff; padding:2px 6px; border-radius:6px; font-size:11px; white-space:nowrap; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_KEY}"></script>
        <script>
          try {
            const nodes = ${JSON.stringify(allPoints)};
            if (!nodes || nodes.length === 0) throw new Error("표시할 마커 없음");

            const map = new naver.maps.Map('map', {
              center: new naver.maps.LatLng(${baseLat}, ${baseLng}),
              zoom: 18.2
            });

            nodes.forEach(p => {
              const color = p.type === "ES" ? "#FACC15" : "#21C9C6"; // 노랑=에스컬레이터, 민트=엘리베이터
              const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(p.lat, p.lng),
                map,
                title: p.title,
                icon: { content: '<div class="dot" style="background:'+color+';"></div>', anchor: new naver.maps.Point(6,6) }
              });
              new naver.maps.Marker({
                position: new naver.maps.LatLng(p.lat, p.lng),
                map,
                icon: { content: '<div class="label">'+p.title+'</div>', anchor: new naver.maps.Point(0,20) },
                clickable: false
              });
            });
          } catch (e) {
            document.body.innerHTML = "<pre style='color:red;font-size:14px;padding:10px;'>"+e.message+"</pre>";
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage("MAP_ERROR:"+e.message);
          }
        </script>
      </body>
      </html>
    `,
    [allPoints, baseLat, baseLng]
  );

  const [webLoading, setWebLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={26} color={INK} onPress={() => navigation.goBack()} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={styles.badge}><Text style={styles.badgeText}>{line}</Text></View>
          <Text style={styles.title}>{stationName}</Text>
        </View>
        <Ionicons name="star-outline" size={24} color={INK} />
      </View>

      <View style={[styles.mapBox, { width, height: width }]}>
        {webLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={MINT} />
          </View>
        )}
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          source={{ html, baseUrl: BASE_URL }}
          onLoadEnd={() => setWebLoading(false)}
          style={{ flex: 1, backgroundColor: "#fff" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: MINT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badge: {
    backgroundColor: "#AEEFED",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: INK, fontWeight: "bold", fontSize: 12 },
  title: { color: INK, fontWeight: "bold", fontSize: 18 },
  mapBox: {
    alignSelf: "center",
    backgroundColor: "#E5F9F8",
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
