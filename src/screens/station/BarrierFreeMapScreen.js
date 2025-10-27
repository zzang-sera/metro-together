// src/screens/station/BarrierFreeMapScreen.js
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import elevatorAll from "../../assets/metro-data/metro/elevator/elevator_seoulstation.json";
import escalatorData from "../../assets/metro-data/metro/escalator/서울시 지하철 출입구 리프트 위치정보.json";
import floorGraphRaw from "../../assets/metro-data/metro/graph/seoul_floor_graph.json";

const NAVER_MAP_KEY = "1stxzdmhn9";
const BASE_URL = "http://192.168.219.107:8081";
const MINT = "#21C9C6";
const INK = "#003F40";

// ─────────────── 유틸 ───────────────
const norm = (t) =>
  String(t || "")
    .replace(/\(.+?\)/g, "")
    .replace(/\s|역/g, "")
    .toLowerCase();

const inKorea = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;

function parseWKT(pointString) {
  if (!pointString) return null;
  const m = pointString.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
  if (!m) return null;
  const lng = parseFloat(m[1]);
  const lat = parseFloat(m[2]);
  return inKorea(lat, lng) ? { lat, lng } : null;
}

function parseLevelNum(f) {
  if (!f) return 0;
  const s = String(f).toUpperCase();
  const mB = s.match(/B(\d+)/);
  const mF = s.match(/(\d+)F/);
  if (mB) return -parseInt(mB[1], 10);
  if (mF) return parseInt(mF[1], 10);
  if (/^1$|^1F$/.test(s)) return 1;
  return 0;
}

function haversine(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

function transportWeight(node) {
  if (node.type === "EV") return 0.7;
  if (node.type === "ES") return 1.0;
  return 1.2;
}

function buildBaseEdges(nodes, MAX_EDGE = 180, K = 6) {
  const edges = new Map();
  for (const a of nodes) {
    const dists = nodes
      .filter((b) => b.id !== a.id)
      .map((b) => {
        const planar = haversine(a, b);
        const dz = Math.abs((a.level || 0) - (b.level || 0)) * 3.5;
        const w = Math.sqrt(planar * planar + dz * dz) * transportWeight(b);
        return { to: b.id, w };
      })
      .filter((e) => e.w <= MAX_EDGE)
      .sort((x, y) => x.w - y.w)
      .slice(0, K);
    edges.set(a.id, dists);
  }
  return edges;
}

function dijkstra(nodes, edges, srcId, dstId) {
  const idSet = new Set(nodes.map((n) => n.id));
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  for (const id of idSet) dist.set(id, Infinity);
  if (!idSet.has(srcId) || !idSet.has(dstId)) return [];
  dist.set(srcId, 0);

  while (visited.size < idSet.size) {
    let u = null;
    let best = Infinity;
    for (const id of idSet) {
      const d = dist.get(id);
      if (!visited.has(id) && d < best) {
        best = d;
        u = id;
      }
    }
    if (u === null) break;
    if (u === dstId) break;

    visited.add(u);
    for (const e of edges.get(u) || []) {
      const alt = dist.get(u) + e.w;
      if (alt < dist.get(e.to)) {
        dist.set(e.to, alt);
        prev.set(e.to, u);
      }
    }
  }

  const path = [];
  let cur = dstId;
  if (!prev.has(cur) && srcId !== dstId) return [];
  path.push(cur);
  while (cur !== srcId) {
    cur = prev.get(cur);
    if (cur == null) return [];
    path.push(cur);
  }
  path.reverse();
  return path;
}

// 가까운 점 중복 제거 (rMeters 이내 하나로)
function dedupePoints(points, rMeters = 8) {
  const out = [];
  for (const p of points) {
    const dup = out.find((q) => haversine(p, q) <= rMeters);
    if (!dup) out.push(p);
  }
  return out;
}

// ─────────────── 메인 ───────────────
export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const webRef = useRef(null);
  const { width } = useWindowDimensions();
  const { stationName = "서울", line = "1호선", type = "ALL" } = route.params || {};
  const stationKey = norm(stationName);

  // ── 데이터 로딩 (에스컬레이터/리프트: 역명 매칭)
  const allES = escalatorData?.DATA || [];
  const esFiltered = allES.filter(
    (n) => norm(n.sbwy_stn_nm || n.SBWY_STN_NM) === stationKey
  );
  const pointsES = esFiltered
    .map((n, i) => {
      const p = parseWKT(n.node_wkt || n.NODE_WKT);
      return p
        ? { id: `ES-${i}`, type: "ES", title: "에스컬레이터/리프트", ...p, level: 0 }
        : null;
    })
    .filter(Boolean);

  // 에스컬레이터 중심(엘리베이터 반경 매칭용)
  const centroid =
    pointsES.length > 0
      ? {
          lat: pointsES.reduce((s, p) => s + p.lat, 0) / pointsES.length,
          lng: pointsES.reduce((s, p) => s + p.lng, 0) / pointsES.length,
        }
      : null;

  // ── 엘리베이터 원본(JSON) + 층그래프(JSON) 병합해서 마커 구성
  const allEV = elevatorAll?.DATA || [];
  const evWithCoord = allEV
    .map((n, i) => {
      const p = parseWKT(n.node_wkt || n.NODE_WKT);
      return p ? { raw: n, id: `EV-${i}`, ...p, level: 0 } : null;
    })
    .filter(Boolean);

  // 1) 역명 필터(원본 JSON)
  const evByName = evWithCoord.filter(
    (x) => norm(x.raw.sbwy_stn_nm || x.raw.SBWY_STN_NM) === stationKey
  );

  // 2) 반경 필터(ES 중심 기준, 역명 없는 EV 보강)
  const EV_RADIUS_M = 240;
  const evByRadius =
    centroid
      ? evWithCoord.filter((x) => haversine({ lat: x.lat, lng: x.lng }, centroid) <= EV_RADIUS_M)
      : [];

  // 3) 층그래프 기반 EV 좌표(스크립트에서 역으로 매칭됨) → 마커에 포함
  const fgEntries = Array.isArray(floorGraphRaw[stationKey]) ? floorGraphRaw[stationKey] : [];
  const evFromFG = fgEntries
    .filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lng))
    .map((e, i) => ({
      id: `FG-${i}`,
      type: "EV",
      title: "엘리베이터",
      lat: e.lat,
      lng: e.lng,
      level: 0,
    }));

  // 최종 EV 후보 합치고 중복 제거
  const pointsEV = dedupePoints(
    [...evByName, ...evByRadius].map((x) => ({
      id: x.id,
      type: "EV",
      title: "엘리베이터",
      lat: x.lat,
      lng: x.lng,
      level: 0,
    })).concat(evFromFG),
    8
  );

  // 표시 대상
  const displayNodes =
    type === "EV" ? pointsEV : type === "ES" ? pointsES : [...pointsEV, ...pointsES];

  // 지도 중심
  const { baseLat, baseLng } = useMemo(() => {
    if (displayNodes.length)
      return {
        baseLat: displayNodes.reduce((s, p) => s + p.lat, 0) / displayNodes.length,
        baseLng: displayNodes.reduce((s, p) => s + p.lng, 0) / displayNodes.length,
      };
    return { baseLat: 37.5665, baseLng: 126.978 };
  }, [displayNodes]);

  // ── 수직 연결(경로탐색용)
  const floorGraph = Array.isArray(floorGraphRaw[stationKey]) ? floorGraphRaw[stationKey] : [];
  const unknownFG = Array.isArray(floorGraphRaw["__UNKNOWN__"]) ? floorGraphRaw["__UNKNOWN__"] : [];

  const routeNodes = [...displayNodes.map((n) => ({ ...n }))];
  const routeEdges = buildBaseEdges(routeNodes, 180, 6);
  const addEdge = (a, b, w) => {
    if (!routeEdges.has(a)) routeEdges.set(a, []);
    routeEdges.get(a).push({ to: b, w });
  };

  const hasNode = new Set(routeNodes.map((n) => n.id));
  const pushNodeIfAbsent = (node) => {
    if (!hasNode.has(node.id)) {
      routeNodes.push(node);
      hasNode.add(node.id);
    }
  };

  const findNearestEVId = (lat, lng) => {
    let best = null,
      bestD = Infinity;
    for (const ev of pointsEV) {
      const d = haversine({ lat, lng }, ev);
      if (d < bestD) {
        bestD = d;
        best = ev.id;
      }
    }
    return best;
  };

  const verticalCostPerFloor = 3.5;
  const addVerticalForEntry = (entry) => {
    const baseEvId =
      entry.evId && pointsEV.find((ev) => ev.id === entry.evId)
        ? entry.evId
        : entry.lat != null && entry.lng != null
        ? findNearestEVId(entry.lat, entry.lng)
        : null;
    if (!baseEvId) return;
    const evBase = pointsEV.find((ev) => ev.id === baseEvId);
    if (!evBase) return;

    const floorSet = new Set();
    (entry.pairs || []).forEach(([f1, f2]) => {
      floorSet.add(f1);
      floorSet.add(f2);
    });

    const floorNodes = {};
    for (const f of floorSet) {
      const id = `${baseEvId}@${f}`;
      const lvl = parseLevelNum(f);
      const vNode = {
        id,
        type: "EV",
        title: `엘리베이터 ${f}`,
        lat: evBase.lat,
        lng: evBase.lng,
        level: lvl,
      };
      pushNodeIfAbsent(vNode);
      addEdge(id, baseEvId, 0.1);
      addEdge(baseEvId, id, 0.1);
      floorNodes[f] = vNode;
    }

    (entry.pairs || []).forEach(([f1, f2]) => {
      const a = floorNodes[f1],
        b = floorNodes[f2];
      if (!a || !b) return;
      const cost =
        Math.abs(parseLevelNum(f1) - parseLevelNum(f2)) * verticalCostPerFloor * 0.5;
      addEdge(a.id, b.id, cost);
      addEdge(b.id, a.id, cost);
    });
  };

  if (Array.isArray(floorGraph)) floorGraph.forEach(addVerticalForEntry);
  if (Array.isArray(unknownFG)) unknownFG.forEach(addVerticalForEntry);

  // ── WebView (마커 크게 + 마커 탭 이벤트 추가)
  const html = useMemo(
    () => `
      <!DOCTYPE html><html lang="ko"><head>
      <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"/>
      <style>
      html,body{margin:0;padding:0;height:100%;background:#e8fdfc;}
      #map{width:100vw;height:100vh;}
      .dot{
        width:28px;height:28px;border-radius:50%;
        border:2px solid #fff;
        box-shadow:0 1px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      }
      .dot::after{
        content:"";display:block;width:14px;height:14px;border-radius:50%;
        background:currentColor; /* 안쪽 점 */
      }
      .label{
        background:rgba(0,0,0,0.6);color:#fff;padding:3px 8px;border-radius:8px;
        font-size:12px;white-space:nowrap
      }
      .selected{ outline:3px solid #2563EB; outline-offset:2px; }
      </style></head><body><div id="map"></div>
      <script src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_KEY}"></script>
      <script>
      const nodes=${JSON.stringify(displayNodes)};
      let map=new naver.maps.Map('map',{center:new naver.maps.LatLng(${baseLat},${baseLng}),zoom:18.2});
      let markers=[],routeLine=null,startPin=null,endPin=null;

      const markerEls = new Map(); // id -> HTMLElement

      nodes.forEach(p=>{
        const isES = p.type==='ES';
        const color = isES ? '#FACC15' : '#21C9C6';
        const el = document.createElement('div');
        el.className='dot';
        el.style.color = color;
        el.style.cursor='pointer';

        const m=new naver.maps.Marker({
          position:new naver.maps.LatLng(p.lat,p.lng),
          map,
          icon:{content:el, anchor:new naver.maps.Point(14,14)}
        });

        // 마커 클릭 → 정확히 해당 노드 선택
        naver.maps.Event.addListener(m,'click',()=>{
          window.ReactNativeWebView?.postMessage(JSON.stringify({type:'MARKER_CLICK', id:'${"$"}{p.id}'}));
        });

        markers.push(m);
        markerEls.set(p.id, el);
      });

      naver.maps.Event.addListener(map,'click',e=>{
        const payload={type:'MAP_CLICK',lat:e.coord.y,lng:e.coord.x};
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      });

      function drawRoute(coords,start,end){
        if(routeLine){routeLine.setMap(null);}
        if(!coords||coords.length===0)return;
        routeLine=new naver.maps.Polyline({path:coords.map(c=>new naver.maps.LatLng(c.lat,c.lng)),map,strokeWeight:6,strokeColor:'#2563EB',strokeOpacity:0.95});
        if(startPin){startPin.setMap(null);}
        if(endPin){endPin.setMap(null);}
        startPin=new naver.maps.Marker({position:new naver.maps.LatLng(start.lat,start.lng),map,icon:{content:'<div class="label">출발</div>',anchor:new naver.maps.Point(0,-6)}});
        endPin=new naver.maps.Marker({position:new naver.maps.LatLng(end.lat,end.lng),map,icon:{content:'<div class="label">도착</div>',anchor:new naver.maps.Point(0,-6)}});
      }

      // 선택된 마커 강조 토글
      function setSelected(id, on){
        const el = markerEls.get(id);
        if(!el) return;
        if(on) el.classList.add('selected'); else el.classList.remove('selected');
      }

      document.addEventListener('message',e=>{
        try{
          const msg=JSON.parse(e.data);
          if(msg.type==='DRAW_ROUTE'){ drawRoute(msg.coords,msg.start,msg.end); }
          if(msg.type==='HILITE'){
            // { idStart, idEnd } 들어오면 하이라이트
            markerEls.forEach((_, key)=>setSelected(key,false));
            if(msg.idStart) setSelected(msg.idStart,true);
            if(msg.idEnd) setSelected(msg.idEnd,true);
          }
        }catch(err){}
      });
      </script></body></html>
    `,
    [displayNodes, baseLat, baseLng]
  );

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [webLoading, setWebLoading] = useState(true);

  const pickNearestNode = (lat, lng) => {
    if (!displayNodes.length) return null;
    let best = null, bestD = Infinity;
    for (const n of displayNodes) {
      const d = haversine({ lat, lng }, n);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  };

  const handleMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === "MAP_CLICK") {
        const best = pickNearestNode(msg.lat, msg.lng);
        if (!best) return;
        if (!start) setStart(best);
        else if (!end) setEnd(best);
        else { setStart(best); setEnd(null); }
      }

      if (msg.type === "MARKER_CLICK") {
        const best = displayNodes.find(n => n.id === msg.id);
        if (!best) return;
        if (!start) setStart(best);
        else if (!end) setEnd(best);
        else { setStart(best); setEnd(null); }
      }
    } catch {}
  };

  // 선택 하이라이트 반영 + 경로 그리기
  useEffect(() => {
    // 하이라이트
    const payloadHilite = {
      type: "HILITE",
      idStart: start?.id || null,
      idEnd: end?.id || null,
    };
    webRef.current?.injectJavaScript(
      `document.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(
        JSON.stringify(payloadHilite)
      )}}));true;`
    );

    // 경로
    if (!start || !end) return;
    const pathIds = dijkstra(routeNodes, routeEdges, start.id, end.id);
    if (pathIds.length === 0) {
      Alert.alert("경로 없음", "두 지점 사이에 연결된 경로가 없습니다.");
      return;
    }
    const idToCoord = new Map();
    for (const n of routeNodes) idToCoord.set(n.id, { lat: n.lat, lng: n.lng });
    const coords = pathIds.map((id) => idToCoord.get(id)).filter(Boolean);
    const payload = {
      type: "DRAW_ROUTE",
      coords,
      start: { lat: start.lat, lng: start.lng },
      end: { lat: end.lat, lng: end.lng },
    };
    webRef.current?.injectJavaScript(
      `document.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(
        JSON.stringify(payload)
      )}}));true;`
    );
  }, [start, end]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MINT} />
      <View style={styles.header}>
        <Ionicons
          name="chevron-back"
          size={26}
          color={INK}
          onPress={() => navigation.goBack()}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{line}</Text>
          </View>
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
          onMessage={handleMessage}
          onLoadEnd={() => setWebLoading(false)}
          style={{ flex: 1, backgroundColor: "#fff" }}
        />
      </View>

      <View style={{ padding: 12 }}>
        <Text style={{ color: "#555" }}>
          마커 탭(권장) 또는 지도 탭으로 출발→도착을 선택하세요. 세 번째 탭 시 초기화됩니다.
        </Text>
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
