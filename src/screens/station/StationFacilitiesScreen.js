import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRoute } from "@react-navigation/native";

// ✅ 역 메타 (code/name/line 확정용)
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";

// ✅ 엘리베이터 가동현황 (로컬 JSON만 사용)
import elevJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

/* ===================== 공통 유틸 ===================== */

function sanitizeName(name = "") {
  if (typeof name !== "string") return "";
  // '서울역(1)' 같은 꼬리표 제거 + trim
  return name.replace(/\(\s*\d+\s*\)$/g, "").trim();
}

function normalizeLine(line = "") {
  const s = String(line).trim();
  const m = s.match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : s;
}

function koKind(kind = "") {
  if (kind === "EV") return "엘리베이터";
  if (kind === "ES") return "에스컬레이터";
  if (kind === "WL") return "휠체어리프트";
  return kind || "-";
}

/* ===================== 역 인덱스(정답표) ===================== */

const STATION_ROWS = Array.isArray(stationJson?.DATA)
  ? stationJson.DATA
  : Array.isArray(stationJson)
  ? stationJson
  : [];

const byCode = new Map();
const byNameLine = new Map();
const byNameFirst = new Map();

for (const row of STATION_ROWS) {
  const code = (row.station_cd ?? row.fr_code ?? row.bldn_id ?? "")
    .toString()
    .trim();
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

/* ===================== 파라미터 정규화 ===================== */

function normalizeParams(raw = {}) {
  const nameRaw = raw.name ?? raw.stationName ?? raw.title ?? "";
  const lineRaw = raw.line ?? raw.lineName ?? raw.route ?? raw.ln ?? "";
  const codeRaw = raw.code ?? raw.stationCode ?? raw.id ?? null;

  const name = sanitizeName(nameRaw);
  const line = normalizeLine(lineRaw);
  const code = typeof codeRaw === "string" ? codeRaw.trim() : codeRaw;

  return { name, line, code };
}

/* ===================== 엘리베이터 JSON 정규화 & 인덱싱 ===================== */

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

  // 상태 표준화
  const status =
    statusRaw === "Y"
      ? "사용가능"
      : statusRaw === "N"
      ? "중지"
      : statusRaw || "-";

  // 라인 비어있으면 역 메타로 보강
  if (!line && code) {
    const meta = findByCode(code);
    if (meta?.line) line = meta.line;
  }

  return {
    code: code.trim(),
    name,
    facilityName,
    section,
    location,
    status,
    kind,
    line,
  };
}

// ✅ 모듈 로드 시 1회만 정규화 & 인덱싱(성능 개선)
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
  const route = useRoute();
  const baseParams = useMemo(() => normalizeParams(route?.params), [route?.params]);

  const [resolved, setResolved] = useState({
    code: baseParams.code ?? null,
    name: baseParams.name ?? "",
    line: baseParams.line ?? "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]); // 표준 스키마 배열

  useEffect(() => {
    console.log(
      `[SFS] resolved params → code=${resolved.code ?? "null"} name=${
        resolved.name || '""'
      } line=${resolved.line || '""'}`
    );
  }, [resolved]);

  const fetchData = useCallback(
    async (opts = { isRefresh: false }) => {
      try {
        setError("");
        if (opts.isRefresh) setRefreshing(true);
        else setLoading(true);

        // 0) 역 메타로 선결정/보강
        let current = { ...resolved };
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

        // 1) 사전 정규화된 테이블에서 필터
        let filtered = [];
        if (current.code) {
          filtered = ELEV_BY_CODE.get(current.code) || [];
        }
        if (filtered.length === 0 && current.name) {
          const n = sanitizeName(current.name);
          filtered = ELEV_ROWS.filter((r) => sanitizeName(r.name) === n);
        }

        // 2) 보강 & 상태 확정
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

        // 3) 결과 세팅
        setResolved(current);
        setRows(filtered);

        // 4) 안내 메시지
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
    [resolved]
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    fetchData({ isRefresh: true });
  }, [fetchData]);

  const renderItem = ({ item }) => {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>
          {sanitizeName(item.name)} ({item.code})
        </Text>
        <Text style={s.meta}>라인: {item.line || resolved.line || "-"}</Text>
        <Text style={s.meta}>시설명: {item.facilityName || "-"}</Text>
        <Text style={s.meta}>종류: {koKind(item.kind)}</Text>
        <Text style={s.meta}>상태: {item.status}</Text>
        <Text style={s.meta}>설치위치: {item.location || "-"}</Text>
        <Text style={s.meta}>운행구간: {item.section || "-"}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* 해석된 역 정보 헤더 */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          {resolved.line ? `${resolved.line} ` : ""}
          {resolved.name || "역 미지정"}
        </Text>
        <Text style={s.headerSub}>코드: {resolved.code ?? "-"}</Text>
      </View>

      {/* 오류 안내 + 재시도 */}
      {!!error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => fetchData()}>
            <Text style={s.retry}>다시 시도</Text>
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
              <Text>표시할 데이터가 없습니다.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

/* ===================== 스타일 ===================== */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  headerSub: { marginTop: 4, color: "#666" },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF2F0",
    borderWidth: 1,
    borderColor: "#FFD6CC",
  },
  errorText: { color: "#B71C1C" },
  retry: { marginTop: 8, fontWeight: "700", color: "#14CAC9" },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6, color: "#111" },
  meta: { color: "#333", marginBottom: 2 },
});
