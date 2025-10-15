// 吏?꾩뿉 ?쒖꽕 留덉빱瑜?李띿뼱二쇰뒗 踰붿슜 而댄룷?뚰듃 (Naver Map 踰꾩쟾)
// interactive: 'none' | 'partial' | 'full'

import React, { useMemo } from "react";
import NaverMapView, { Marker } from "@mj-studio/react-native-naver-map";
import { View, Text, StyleSheet } from "react-native";

// ?꾩씠肄??됱긽
const colorByStatus = (s) =>
  /?뺤긽|?ъ슜媛??.test(s || "") ? "#10b981" : /以?.test(s || "") ? "#f59e0b" : "#64748b";

/** 怨좎젙 ?쒖닔: 媛숈? id硫???긽 媛숈? 吏?곌? ?섏삤寃?*/
function seededRand(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000; // 0~1
}

/** ??醫뚰몴 二쇰??쇰줈 理쒕? rMeters 諛섍꼍 吏??*/
function jitterAround(lat, lng, id, rMeters = 25) {
  const r = seededRand(id);
  const theta = 2 * Math.PI * seededRand(id + "|t");
  const d = r * rMeters; // 0~rMeters
  const dLat = d / 111111;
  const dLng = d / (111111 * Math.cos((lat * Math.PI) / 180));
  return {
    latitude: lat + dLat * Math.cos(theta),
    longitude: lng + dLng * Math.sin(theta),
  };
}

/**
 * props
 * - station: { name, lat, lng }
 * - items: [{id, title, desc, status, line}]
 * - showUser: boolean (?ㅼ씠踰꾨㏊ 湲곕낯 踰꾪듉 ?몄텧留?媛?ν븯誘濡??ш린?쒕뒗 蹂대쪟)
 * - mapHeight: number (湲곕낯 300)
 * - interactive: 'none' | 'partial' | 'full'
 *      none    : 遺紐??ㅽ겕濡?100% ?곗꽑(吏???곗튂 ?꾩쟾 ?듦낵)
 *      partial : ?쒕옒洹??移??뚯쟾/?명듃 ?쒖뒪泥섎쭔 鍮꾪솢??留덉빱 ??媛??
 *      full    : 吏???꾩쟾 議곗옉 媛??
 */
export default function FacilityMap({
  station,
  items = [],
  showUser = false, // ?꾩옱 援ы쁽?먯꽑 ?ъ슜 ?????ㅼ씠踰꾨㏊? ?꾩튂踰꾪듉/?몃옒???ㅼ젙??蹂꾨룄)
  mapHeight = 300,
  interactive = "partial",
}) {
  // 以묒떖/以?怨꾩궛 (?ㅼ씠踰꾨뒗 center + zoom)
  const center = useMemo(() => {
    const lat = Number(station?.lat) || 37.5665;
    const lng = Number(station?.lng) || 126.978;
    // ?異?援ш???delta 0.005 ???ㅼ씠踰?以?15 洹쇱쿂
    const zoom = 15;
    return { latitude: lat, longitude: lng, zoom };
  }, [station]);

  const markers = useMemo(() => {
    const lat = Number(station?.lat);
    const lng = Number(station?.lng);
    if (!lat || !lng) return [];
    return items.map((it, idx) => {
      const p = jitterAround(lat, lng, it.id ? String(it.id) : String(idx));
      return { ...it, coordinate: p };
    });
  }, [items, station]);

  // ?쒖뒪泥??곗튂 ?쒖뼱
  const disableAllTouches = interactive === "none";
  const isPartial = interactive === "partial";

  // ?ㅼ씠踰꾨㏊ ?쒖뒪泥??뚮옒洹?(?⑦궎吏???쒖? prop ?대쫫?ㅼ쓣 ?ъ슜)
  // - full: 紐⑤뱺 ?쒖뒪泥?true (湲곕낯媛?
  // - partial: ?쒕옒洹??移??뚯쟾/?명듃 false
  // - none: ?꾩? 媛숈?留?pointerEvents='none'?쇰줈 ?곗튂 ?먯껜瑜??듦낵?쒗궡
  const gestureProps = isPartial
    ? {
        scrollGesturesEnabled: false,
        zoomGesturesEnabled: false,
        rotateGesturesEnabled: false,
        tiltGesturesEnabled: false,
      }
    : {};

  const pointerEvents = disableAllTouches ? "none" : "auto";

  return (
    <View style={[styles.mapBox, { height: mapHeight }]}>
      <NaverMapView
        style={StyleSheet.absoluteFillObject}
        center={center}
        // ?꾩튂 踰꾪듉/?섏묠諛??깆? ?꾩슂??true濡?蹂寃?媛??
        // locationButtonEnabled={showUser}
        // compassEnabled
        useTextureView
        pointerEvents={pointerEvents}
        {...gestureProps}
      >
        {/* ???먯껜 留덉빱 */}
        {station?.lat && station?.lng && (
          <Marker
            coordinate={{
              latitude: Number(station.lat),
              longitude: Number(station.lng),
            }}
            pinColor="#2563eb"
            caption={{ text: station?.name || "??, align: "top" }}
          />
        )}

        {/* ?쒖꽕 留덉빱??*/}
        {markers.map((m) => (
          <Marker
            key={String(m.id)}
            coordinate={m.coordinate}
            pinColor={colorByStatus(m.status)}
            caption={{ text: m.title || "?쒖꽕", align: "top" }}
          />
        ))}
      </NaverMapView>

      {/* 媛꾨떒 ?덈궡 (?좏깮) */}
      <View style={styles.footer}>
        <Text style={styles.hint}>
          * ?꾩튂????湲곗? 洹쇱궗 ?쒖떆?낅땲??
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eef2ff",
  },
  footer: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    alignItems: "flex-start",
  },
  hint: { color: "#9ca3af", fontSize: 11, backgroundColor: "white", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
});
