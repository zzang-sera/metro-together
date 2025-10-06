import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from "react-native";

// ✅ 로컬 JSON 직사용
import elevJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";

/* ---------- 유틸 ---------- */
const sanitizeName = (s = "") =>
  typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";
const normalizeLine = (line = "") => {
  const m = String(line).match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : String(line);
};
const koStatus = (v = "") =>
  v === "Y" ? "사용가능" : v === "N" ? "중지" : v || "-";
const koKind = (k = "") =>
  k === "EV" ? "엘리베이터" : k === "ES" ? "에스컬레이터" : k === "WL" ? "휠체어리프트" : k || "-";

/* ---------- 역 메타 인덱스 (코드→이름/호선) ---------- */
const STATION_ROWS = Array.isArray(stationJson?.DATA)
  ? stationJson.DATA
  : Array.isArray(stationJson)
  ? stationJson
  : [];
const META_BY_CODE = new Map();
for (const r of STATION_ROWS) {
  const code = (r.station_cd ?? r.fr_code ?? r.bldn_id ?? "").toString().trim();
  if (!code) continue;
  META_BY_CODE.set(code, {
    code,
    name: sanitizeName(r.name ?? ""),
    line: normalizeLine(r.line ?? ""),
  });
}

/* ---------- 엘리베이터 JSON 파싱/정규화 ---------- */
function pickElevArray(any) {
  if (Array.isArray(any)) return any;
  if (Array.isArray(any?.DATA)) return any.DATA;
  if (Array.isArray(any?.row)) return any.row;
  for (const k of Object.keys(any || {})) {
    const v = any[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray(v.row)) return v.row;
      if (Array.isArray(v.DATA)) return v.DATA;
    }
  }
  return [];
}

function normalizeElevRow(raw) {
  const stationCode = String(
    raw.station_cd ?? raw.STN_CD ?? raw.code ?? raw.stationCode ?? ""
  ).trim();
  const stationName = sanitizeName(
    raw.station_nm ?? raw.STN_NM ?? raw.name ?? raw.stationName ?? ""
  );
  const facilityName = raw.elvtr_nm ?? raw.ELVTR_NM ?? raw.facilityName ?? "";
  const section = raw.opr_sec ?? raw.OPR_SEC ?? raw.section ?? "";
  const gate = raw.instl_pstn ?? raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const status = koStatus(raw.use_yn ?? raw.USE_YN ?? raw.status ?? "");
  const kind = raw.elvtr_se ?? raw.ELVTR_SE ?? raw.kind ?? "";
  const meta = META_BY_CODE.get(stationCode) || {};
  const line = meta.line || normalizeLine(raw.line ?? raw.LINE_NUM ?? raw.lineName ?? "");
  return {
    stationCode,
    stationName: stationName || meta.name || "",
    line,
    facilityName,
    section,
    gate,
    status,
    kind,
  };
}

const ELEV_ROWS = pickElevArray(elevJson).map(normalizeElevRow);
const BY_CODE = new Map();
const BY_NAME = new Map();
for (const r of ELEV_ROWS) {
  if (r.stationCode) {
    const a = BY_CODE.get(r.stationCode) || [];
    a.push(r);
    BY_CODE.set(r.stationCode, a);
  }
  if (r.stationName) {
    const n = sanitizeName(r.stationName);
    const a = BY_NAME.get(n) || [];
    a.push(r);
    BY_NAME.set(n, a);
  }
}

/* ---------- 컴포넌트 ---------- */
export default function StationDetailScreen({ route }) {
  const { stationCode, stationName } = route.params ?? {};
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    try {
      const out = stationCode
        ? BY_CODE.get(String(stationCode)) || []
        : BY_NAME.get(sanitizeName(stationName || "")) || [];
      setRows(out);
    } catch (e) {
      setErr(e?.message || "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [stationCode, stationName]);

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </SafeAreaView>
    );
  }
  if (err) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={{ color: "red", fontWeight: "600" }}>오류: {err}</Text>
      </SafeAreaView>
    );
  }
  if (rows.length === 0) {
    return (
      <SafeAreaView style={s.center}>
        <Text>표시할 시설 정보가 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const Header = () => (
    <View style={s.header}>
      <Text style={s.headerTitle}>
        {rows[0]?.stationName} ({rows[0]?.stationCode})
      </Text>
      <Text style={s.headerSub}>상세 시설 정보</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={s.row}>
      <Text style={s.rowName}>{item.facilityName}</Text>
      <Text>위치: {item.gate || "-"}</Text>
      <Text>구간: {item.section || "-"}</Text>
      <Text>상태: {item.status || "-"}</Text>
      <Text>종류: {koKind(item.kind)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={rows}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { marginTop: 4, color: "#666" },
  row: { padding: 12, borderBottomWidth: 1, borderColor: "#f1f1f1" },
  rowName: { fontWeight: "600", marginBottom: 4 },
});
