// src/screens/station/BarrierFreeMapScreen.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 서울 전체역 엘리베이터 좌표 (DESCRIPTION + DATA)
import elevatorSeoulStation from "../../assets/metro-data/metro/elevator/elevator_seoulstation.json";
const elevatorAll = elevatorSeoulStation;

const NAVER_MAP_KEY = "1stxzdmhn9"; // 네이버 지도 Client ID
const BASE_URL = "http://192.168.219.107:8081";
const MINT = "#21C9C6";
const INK = "#003F40";

/** POINT(126.x 37.x) → {lat, lng} */
function parseWKT(pointString) {
  if (!pointString) return null;
  const match = pointString.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!match) return null;
  const lng = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const webRef = useRef(null);

  const { stationName = "서울", line = "1호선", type = "EV" } = route.params || {};
  console.log("🧭 [BarrierFreeMapScreen] route.params =", route.params);

  // ✅ JSON 데이터 구조 (DESCRIPTION + DATA)
  const allNodes = elevatorAll?.DATA || [];

  // ✅ 역 이름 필터링 (대소문자/공백 무시)
  const filteredNodes = allNodes.filter((n) => {
    const name = (n.sbwy_stn_nm || n.SBWY_STN_NM || "").replace(/\s+/g, "").toLowerCase();
    const target = stationName.replace(/\s+/g, "").toLowerCase();
    return name === target;
  });

  // ✅ 해당 역의 좌표 리스트
  const points = filteredNodes.map((n) => parseWKT(n.node_wkt || n.NODE_WKT)).filter(Boolean);

  // ✅ 중심 계산 (없으면 서울시청 fallback)
  const centerLat =
    points.length > 0 ? points.reduce((s, p) => s + p.lat, 0) / points.length : 37.5665;
  const centerLng =
    points.length > 0 ? points.reduce((s, p) => s + p.lng, 0) / points.length : 126.9780;

  console.log(`📍 ${stationName} matched points:`, points.length);

  // ✅ WebView에 주입할 HTML
  const html = useMemo(
    () => `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8fdfc; }
          #status {
            position: absolute; top: 6px; left: 6px; z-index: 9999;
            background: rgba(0,0,0,0.65); color: #0f0;
            padding: 4px 8px; font: 12px monospace; border-radius: 4px;
          }
          .dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; }
        </style>
      </head>
      <body>
        <div id="status">📡 지도 로드 중...</div>
        <div id="map"></div>
        <script src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_KEY}"></script>
        <script>
          const statusBox = document.getElementById('status');
          const nodes = ${JSON.stringify(points)};
          const stationName = ${JSON.stringify(stationName)};
          const center = { lat: ${centerLat}, lng: ${centerLng} };

          function makeMarkerIcon(color) {
            return {
              content: '<div class="dot" style="background:'+color+';"></div>',
              anchor: new naver.maps.Point(6,6),
            };
          }

          try {
            const map = new naver.maps.Map('map', {
              center: new naver.maps.LatLng(center.lat, center.lng),
              zoom: 17,
              zoomControl: true,
              zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
            });

            // 중심(역) 마커
            new naver.maps.Marker({
              position: new naver.maps.LatLng(center.lat, center.lng),
              map,
              title: stationName + " 중심",
              icon: makeMarkerIcon('#003F40'),
            });

            // 노드별 마커 (엘리베이터)
            nodes.forEach((p, i) => {
              new naver.maps.Marker({
                position: new naver.maps.LatLng(p.lat, p.lng),
                map,
                title: stationName + ' 엘리베이터 ' + (i + 1),
                icon: makeMarkerIcon('#9CA3AF'),
              });
            });

            statusBox.textContent = '✅ ' + stationName + ' 지도 로드 완료 (' + nodes.length + '개 마커)';
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('__MAP_READY__');
          } catch (e) {
            statusBox.textContent = '❌ 오류: ' + e.message;
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('__MAP_ERROR__:' + e.message);
          }
        </script>
      </body>
      </html>
    `,
    [stationName, centerLat, centerLng, points]
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

      <View style={styles.mapBox}>
        {webLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={MINT} />
            <Text style={{ marginTop: 10, color: "#555" }}>지도를 불러오는 중...</Text>
          </View>
        )}
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          source={{ html, baseUrl: BASE_URL }}
          onMessage={(e) => {
            const msg = e.nativeEvent.data;
            if (msg === "__MAP_READY__") setWebLoading(false);
            else if (msg.startsWith("__MAP_ERROR__")) {
              Alert.alert("지도 오류", msg.replace("__MAP_ERROR__:", ""));
            }
          }}
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
    backgroundColor: "#E5F9F8",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    height: 280,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
