// src/api/elevLocal.js
// Data source:
//   src/assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json

// ✅ RN/Expo(Metro)는 JSON을 기본 import로 읽을 수 있음 (assert 불필요)
import elevJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

/* ---------------------- 유틸 ---------------------- */

function pickArray(any) {
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

// 역명 끝의 "(숫자)" 제거
function sanitizeName(s = "") {
  return typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";
}

function koStatus(v = "") {
  if (v === "Y") return "사용가능";
  if (v === "N") return "중지";
  return v || "-";
}

/* ---------------------- 정규화 ---------------------- */

function toPretty(raw) {
  const stationCode = String(
    raw.stn_cd ?? raw.STN_CD ?? raw.station_cd ?? raw.code ?? raw.stationCode ?? ""
  ).trim();

  const stationNameFull =
    raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? raw.stationName ?? "";
  const stationName = sanitizeName(stationNameFull);

  const facilityName = raw.elvtr_nm ?? raw.ELVTR_NM ?? raw.facilityName ?? "";
  const section = raw.opr_sec ?? raw.OPR_SEC ?? raw.section ?? "";
  const gate = raw.instl_pstn ?? raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const status = koStatus(raw.use_yn ?? raw.USE_YN ?? raw.status ?? "");
  const kind = raw.elvtr_se ?? raw.ELVTR_SE ?? raw.kind ?? "";
  const line = String(raw.line ?? raw.LINE_NUM ?? raw.lineName ?? "").trim();

  return { stationCode, stationName, facilityName, section, gate, status, kind, line };
}

/* ---------------------- 인덱스 (모듈 로드시 1회) ---------------------- */

const RAW_ROWS = pickArray(elevJson);
const INDEX_BY_CODE = new Map(); // stationCode → raw[]
const INDEX_BY_NAME = new Map(); // stationName(sanitized) → raw[]

for (const r of RAW_ROWS) {
  const code = String(
    r.stn_cd ?? r.STN_CD ?? r.station_cd ?? r.code ?? r.stationCode ?? ""
  ).trim();
  const name = sanitizeName(
    r.stn_nm ?? r.STN_NM ?? r.station_nm ?? r.name ?? r.stationName ?? ""
  );

  if (code) {
    const a = INDEX_BY_CODE.get(code) || [];
    a.push(r);
    INDEX_BY_CODE.set(code, a);
  }
  if (name) {
    const b = INDEX_BY_NAME.get(name) || [];
    b.push(r);
    INDEX_BY_NAME.set(name, b);
  }
}

/* ---------------------- 공개 API ---------------------- */

// 코드로 조회 (raw 배열 반환)
export async function getElevByCode(code) {
  const k = String(code || "").trim();
  if (!k) return [];
  const rows = INDEX_BY_CODE.get(k) || [];
  return rows.slice();
}

// 역명으로 조회 (raw 배열 반환) — 역명은 괄호 숫자 제거 후 비교
export async function getElevByName(name) {
  const k = sanitizeName(name || "");
  if (!k) return [];
  const rows = INDEX_BY_NAME.get(k) || [];
  return rows.slice();
}

// 화면 바인딩용 표준 스키마로 변환
export function prettify(rows) {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map(toPretty);
}

// 편의: 단일 쿼리로 검색 + prettify (코드/역명 자동 판별)
export function searchElev(query) {
  const q = String(query || "").trim();
  if (!q) return [];
  if (/^\d+$/.test(q)) return prettify(INDEX_BY_CODE.get(q) || []);
  return prettify(INDEX_BY_NAME.get(sanitizeName(q)) || []);
}

// 레거시 호환: 코드로 조회해 간단 키로 매핑 (StationFacilitiesScreen 등에서 사용)
export function getElevatorsByCode(stnCd) {
  const k = String(stnCd || "").trim();
  const rows = INDEX_BY_CODE.get(k) || [];
  if (!rows.length) return null;
  return rows.map((r) => ({
    type: r.elvtr_se ?? r.ELVTR_SE ?? r.kind ?? "",
    name: r.elvtr_nm ?? r.ELVTR_NM ?? r.facilityName ?? "",
    status: r.use_yn ?? r.USE_YN ?? r.status ?? "",
    section: r.opr_sec ?? r.OPR_SEC ?? r.section ?? "",
    position: r.instl_pstn ?? r.INSTL_PSTN ?? r.location ?? r.gate ?? "",
    stationCode:
      r.stn_cd ?? r.STN_CD ?? r.station_cd ?? r.code ?? r.stationCode ?? "",
    stationName: sanitizeName(
      r.stn_nm ?? r.STN_NM ?? r.station_nm ?? r.name ?? r.stationName ?? ""
    ),
    line: r.line ?? r.LINE_NUM ?? r.lineName ?? "",
  }));
}
