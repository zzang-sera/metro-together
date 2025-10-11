//src/screens/station/StationFacilitiesScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRoute } from "@react-navigation/native";

// 1. 필요한 훅과 유틸리티를 불러옵니다.
import { useFontSize } from "../../contexts/FontSizeContext";
import { responsiveFontSize, responsiveHeight } from "../../utils/responsive";

// 역 메타 및 엘리베이터 JSON 데이터
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";
import elevJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

/* --- 유틸 함수 및 데이터 인덱싱 (기존과 동일) --- */
const sanitizeName = (name = "") => {
  if (typeof name !== "string") return "";
  return name.replace(/\(\s*\d+\s*\)$/g, "").trim();
};
const normalizeLine = (line = "") => {
  const s = String(line).trim();
  const m = s.match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : s;
};
const koKind = (kind = "") => {
  if (kind === "EV") return "엘리베이터";
  if (kind === "ES") return "에스컬레이터";
  if (kind === "WL") return "휠체어리프트";
  return kind || "-";
};

const STATION_ROWS = Array.isArray(stationJson?.DATA)
  ? stationJson.DATA
  : Array.isArray(stationJson)
  ? stationJson
  : [];
const byCode = new Map();
const byNameLine = new Map();
const byNameFirst = new Map();
for (const row of STATION_ROWS) {
  const code = (row.station_cd ?? row.fr_code ?? row.bldn_id ?? "").toString().trim();
  const name = sanitizeName(row.name ?? "");
  const line = normalizeLine(row.line ?? "");
  if (!name) continue;
  const rec = { code: code || null, name, line };
  if (code) byCode.set(code, rec);
  if (line) byNameLine.set(`${name}|${line}`, rec);
  if (!byNameFirst.has(name)) byNameFirst.set(name, rec);
}
function findByCode(code) {
  if (!code) return null;
  return byCode.get(code) || null;
}
function findByNameAndLine(name, line) {
  const n = sanitizeName(name);
  const l = normalizeLine(line || "");
  if (!n) return null;
  if (l) {
    const rec = byNameLine.get(`${n}|${l}`);
    if (rec) return rec;
  }
  return byNameFirst.get(n) || null;
}
function normalizeParams(raw = {}) {
  const nameRaw = raw.name ?? raw.stationName ?? raw.title ?? "";
  const lineRaw = raw.line ?? raw.lineName ?? raw.route ?? raw.ln ?? "";
  const codeRaw = raw.code ?? raw.stationCode ?? raw.id ?? null;
  const name = sanitizeName(nameRaw);
  const line = normalizeLine(lineRaw);
  const code = typeof codeRaw === "string" ? codeRaw.trim() : codeRaw;
  return { name, line, code };
}
function pickElevArray(anyJson) {
  if (Array.isArray(anyJson)) return anyJson;
  if (Array.isArray(anyJson?.DATA)) return anyJson.DATA;
  if (Array.isArray(anyJson?.row)) return anyJson.row;
  for (const k of Object.keys(anyJson || {})) {
    const v = anyJson[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray(v.row)) return v.row;
      if (Array.isArray(v.DATA)) return v.DATA;
    }
  }
  return [];
}
function normalizeElevRow(raw) {
  const code = String(
    raw.stn_cd ?? raw.STN_CD ?? raw.station_cd ?? raw.code ?? raw.stationCode ?? ""
  ).trim();
  const name = sanitizeName(
    raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? raw.stationName ?? ""
  );
  const facilityName = raw.elvtr_nm ?? raw.ELVTR_NM ?? raw.facilityName ?? "";
  const section = raw.opr_sec ?? raw.OPR_SEC ?? raw.section ?? "";
  const location =
    raw.instl_pstn ?? raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const statusRaw = raw.use_yn ?? raw.USE_YN ?? raw.status ?? "";
  const kind = raw.elvtr_se ?? raw.ELVTR_SE ?? raw.kind ?? "";
  let line = normalizeLine(raw.line ?? raw.LINE_NUM ?? raw.lineName ?? "");

  const status =
    statusRaw === "Y"
      ? "사용가능"
      : statusRaw === "N"
      ? "중지"
      : statusRaw || "-";

  if (!line && code) {
    const meta = findByCode(code);
    if (meta?.line) line = meta.line;
  }

  return { code: code.trim(), name, facilityName, section, location, status, kind, line };
}
const ELEV_ROWS = pickElevArray(elevJson).map(normalizeElevRow);
const ELEV_BY_CODE = new Map();
for (const r of ELEV_ROWS) {
  if (!r.code) continue;
  const arr = ELEV_BY_CODE.get(r.code) || [];
  arr.push(r);
  ELEV_BY_CODE.set(r.code, arr);
}

/* ===================== 화면 컴포넌트 ===================== */

export default function StationFacilitiesScreen() {
  const { fontOffset } = useFontSize();
  const route = useRoute();
  const baseParams = useMemo(() => normalizeParams(route?.params), [route?.params]);
  
  const [resolved, setResolved] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  // 👇 [수정] fetchData의 의존성을 baseParams로 변경하여, route.params가 바뀔 때마다 다시 실행되도록 합니다.
  const fetchData = useCallback(
    async (opts = { isRefresh: false }) => {
      try {
        setError("");
        if (opts.isRefresh) setRefreshing(true);
        else setLoading(true);

        let current = { ...baseParams };

        if (!current.code && current.name) {
          const meta = findByNameAndLine(current.name, current.line);
          if (meta?.code) {
            current.code = meta.code;
            if (!current.line) current.line = meta.line;
          }
        } else if (current.code && !current.line) {
          const meta = findByCode(current.code);
          if (meta?.line) current.line = meta.line;
          if (!current.name && meta?.name) current.name = meta.name;
        }

        let filtered = [];
        if (current.code) {
          filtered = ELEV_BY_CODE.get(current.code) || [];
        }
        if (filtered.length === 0 && current.name) {
          const n = sanitizeName(current.name);
          filtered = ELEV_ROWS.filter((r) => sanitizeName(r.name) === n);
        }

        if ((!current.name || !current.line) && filtered.length) {
          const r0 = filtered[0];
          current.name = sanitizeName(current.name || r0.name || "");
          if (!current.line) current.line = r0.line || current.line || "";
        }
        if (!current.name || !current.line) {
          const meta = current.code
            ? findByCode(current.code)
            : findByNameAndLine(current.name, current.line);
          if (meta) {
            if (!current.name) current.name = meta.name;
            if (!current.line) current.line = meta.line;
          }
        }

        setResolved(current);
        setRows(filtered);

        if (filtered.length === 0) {
          const msg = current.code || current.name
            ? `해당 역 설비 데이터가 없습니다. (${current.line || ""} ${current.name || ""} / 코드 ${current.code || "-"})`
            : "표시할 데이터가 없습니다.";
          setError(msg);
        }
      } catch (e) {
        setError(e?.message || String(e));
        setRows([]);
      } finally {
        if (opts.isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [baseParams] // fetchData는 baseParams가 변경될 때만 새로 생성됩니다.
  );

  // 👇 [수정] useEffect가 fetchData 함수 자체의 변경을 감지하도록 수정합니다.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData({ isRefresh: true });
  }, [fetchData]);

  const renderItem = ({ item }) => {
    return (
      <View style={s.card}>
        <Text style={[s.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          {sanitizeName(item.name)} ({item.code})
        </Text>
        <Text style={[s.meta, { fontSize: responsiveFontSize(14) + fontOffset }]}>라인: {item.line || resolved.line || "-"}</Text>
        <Text style={[s.meta, { fontSize: responsiveFontSize(14) + fontOffset }]}>시설명: {item.facilityName || "-"}</Text>
        <Text style={[s.meta, { fontSize: responsiveFontSize(14) + fontOffset }]}>종류: {koKind(item.kind)}</Text>
        <Text style={[s.meta, { fontSize: responsiveFontSize(14) + fontOffset }]}>상태: {item.status}</Text>
        <Text style={[s.meta, { fontSize: responsiveFontSize(14) + fontOffset }]}>설치위치: {item.location || "-"}</Text>
        <Text style={[s.meta, { fontSize: responsiveFontSize(14) + fontOffset }]}>운행구간: {item.section || "-"}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator />
        <Text style={[s.centerText, { fontSize: responsiveFontSize(16) + fontOffset, marginTop: 8 }]}>
          불러오는 중…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={[s.headerTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
          {resolved.line ? `${resolved.line} ` : ""}
          {resolved.name || "역 미지정"}
        </Text>
        <Text style={[s.headerSub, { fontSize: responsiveFontSize(14) + fontOffset }]}>코드: {resolved.code ?? "-"}</Text>
      </View>

      {!!error && (
        <View style={s.errorBox}>
          <Text style={[s.errorText, { fontSize: responsiveFontSize(14) + fontOffset }]}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => fetchData()}>
            <Text style={[s.retry, { fontSize: responsiveFontSize(14) + fontOffset }]}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !error ? (
            <View style={s.center}>
              <Text style={[s.centerText, { fontSize: responsiveFontSize(16) + fontOffset }]}>표시할 데이터가 없습니다.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#fff' },
  centerText: {
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    color: '#333'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  headerTitle: { fontSize: responsiveFontSize(18), fontWeight: "700", color: "#111", fontFamily: 'NotoSansKR' },
  headerSub: { marginTop: 4, color: "#666", fontSize: responsiveFontSize(14), fontFamily: 'NotoSansKR' },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF2F0",
    borderWidth: 1,
    borderColor: "#FFD6CC",
  },
  errorText: { color: "#B71C1C", fontSize: responsiveFontSize(14), fontFamily: 'NotoSansKR' },
  retry: { marginTop: 8, fontWeight: "700", color: "#14CAC9", fontSize: responsiveFontSize(14), fontFamily: 'NotoSansKR' },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardTitle: { fontSize: responsiveFontSize(16), fontWeight: "700", marginBottom: 6, color: "#111", fontFamily: 'NotoSansKR' },
  meta: { color: "#333", marginBottom: 2, fontSize: responsiveFontSize(14), fontFamily: 'NotoSansKR', lineHeight: responsiveHeight(20) },
});

