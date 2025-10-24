// src/screens/station/FacilityTypeScreen.js
let WebViewComp = null;
try {
  // 정적 import 금지! 화면 안에서만 require
  WebViewComp = require('react-native-webview').WebView;
} catch {}

import React, { useMemo, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize } from "../../utils/responsive";
import { getElevatorsByCode } from "../../api/elevLocal";
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID; // .env에서 주입
const STATIONS = stationJson?.DATA || [];

const TYPES = { ELEVATOR:"elevator", ESCALATOR:"escalator" };

export default function FacilityTypeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();

  const { stationCode = "", stationName = "", line = "", type = TYPES.ELEVATOR } = route.params || {};

  // 좌표 찾아오기
  const stationMeta = useMemo(
    () => STATIONS.find(s => String(s.STATION_CD) === String(stationCode)) || null,
    [stationCode]
  );
  const coord = useMemo(() => {
    const lat = Number(stationMeta?.Y);
    const lng = Number(stationMeta?.X);
    return (Number.isFinite(lat) && Number.isFinite(lng))
      ? { latitude: lat, longitude: lng }
      : { latitude: 37.5665, longitude: 126.9780 }; // 서울시청
  }, [stationMeta]);

  // 데이터(예: 엘리베이터만 실제)
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const data = (type === TYPES.ELEVATOR)
          ? ((await getElevatorsByCode(String(stationCode))) || [])
          : [];
        if (!cancel) setRows(data);
      } catch {
        if (!cancel) setRows([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [type, stationCode]);

  // WebView HTML
  const webRef = useRef(null);
  const html = useMemo(() => {
    const { latitude, longitude } = coord;
    const safeName = (stationName || "역").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // NAVER_CLIENT_ID가 없는 경우를 대비해 안내문도 포함
    return `
<!doctype html><html lang="ko"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>
  html,body,#map{height:100%;margin:0}
  .caption{position:absolute;top:8px;left:8px;background:rgba(255,255,255,.9);padding:6px 8px;border-radius:8px;font:12px -apple-system,Roboto,'Noto Sans KR',sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.1)}
  .warn{position:absolute;top:8px;right:8px;background:#fff3cd;color:#664d03;border:1px solid #ffecb5;padding:6px 8px;border-radius:8px;font:12px -apple-system,Roboto,'Noto Sans KR',sans-serif}
</style>
${NAVER_CLIENT_ID ? `<script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}"></script>` : ""}
</head>
<body>
  <div id="map"></div>
  <div class="caption">${safeName}</div>
  ${!NAVER_CLIENT_ID ? `<div class="warn">NAVER CLIENT ID가 설정되지 않았습니다.</div>` : ""}
  <script>
    (function(){
      ${NAVER_CLIENT_ID ? `
      var center = new naver.maps.LatLng(${latitude}, ${longitude});
      var map = new naver.maps.Map('map', { center:center, zoom:15, logoControl:false, mapDataControl:false, scaleControl:true });
      var marker = new naver.maps.Marker({ position:center, map:map });
      document.addEventListener('message', function(e){
        try{
          var msg = JSON.parse(e.data||'{}');
          if(msg.type==='move' && msg.lat && msg.lng){
            var p = new naver.maps.LatLng(msg.lat, msg.lng);
            map.setCenter(p); marker.setPosition(p);
          }
        }catch(_){}
      });` : `
      document.body.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;font:14px -apple-system,Roboto,sans-serif;color:#666">NAVER CLIENT ID가 없어서 지도를 로드할 수 없습니다.</div>';
      `}
    })();
  </script>
</body></html>`;
  }, [coord, stationName]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityLabel="뒤로가기">
          <Ionicons name="chevron-back" size={22 + fontOffset / 2} color={INK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.badge}><Text style={[styles.badgeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>{line || "?"}</Text></View>
          <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>{stationName || "역명"}</Text>
        </View>
        <View style={{ minWidth: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>역 위치 (Naver Map)</Text>
          <View style={styles.mapWrap}>
            {WebViewComp ? (
              <WebViewComp
                ref={webRef}
                originWhitelist={["*"]}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                automaticallyAdjustContentInsets={false}
                mixedContentMode="always"
                style={styles.map}
              />
            ) : (
              <View style={[styles.map, styles.centerBox]}>
                <Ionicons name="information-circle-outline" size={18} color="#888" />
                <Text style={{ marginTop: 6, color: "#666", textAlign: "center" }}>
                  지도를 표시하려면 react-native-webview가 필요합니다.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>엘리베이터 목록</Text>
          {loading ? (
            <View style={styles.centerBox}><ActivityIndicator /><Text style={{ marginTop: 8, color: "#666" }}>불러오는 중…</Text></View>
          ) : rows.length === 0 ? (
            <View style={styles.centerBox}><Ionicons name="information-circle-outline" size={18} color="#888" /><Text style={{ marginTop: 6, color: "#666" }}>표시할 항목이 없습니다.</Text></View>
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

const MINT="#21C9C6", INK="#003F40", BG="#F9F9F9";
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BG},
  header:{backgroundColor:MINT,paddingHorizontal:12,paddingBottom:12,flexDirection:"row",alignItems:"center"},
  headerBtn:{padding:6,minWidth:36,alignItems:"center"},
  headerCenter:{flex:1,alignItems:"center"},
  headerTitle:{color:INK,fontWeight:"bold"},
  badge:{backgroundColor:"#AEEFED",paddingHorizontal:8,paddingVertical:2,borderRadius:10,marginBottom:4},
  badgeText:{color:INK,fontWeight:"bold"},
  card:{backgroundColor:"#fff",borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:"#E6ECEB",
        shadowColor:"#000",shadowOpacity:0.05,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:2},
  cardTitle:{color:"#1f2937",fontWeight:"bold"},
  mapWrap:{height:220,borderRadius:12,overflow:"hidden",marginTop:8},
  map:{width:"100%",height:"100%",backgroundColor:"#eee"},
  centerBox:{alignItems:"center",justifyContent:"center"},
  item:{backgroundColor:"#fff",borderRadius:12,padding:12,borderWidth:1,borderColor:"#E6ECEB",marginTop:8},
  itemTitle:{color:"#0a7b7a",fontWeight:"bold"},
  itemSub:{marginTop:4,color:"#445655"},
});
