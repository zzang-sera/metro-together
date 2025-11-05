
import rawJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

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

function sanitizeName(s = "") {
  return typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";
}

function koStatus(v = "") {
  if (v === "Y" || v === "사용가능") return "사용가능";
  if (v === "N" || v === "중지" || v === "보수중") return "보수중";
  return v || "정보없음";
}

function normalizeLine(line = "") {
  const m = String(line).match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : String(line || "");
}

function toPretty(raw) {
  const stationNameFull =
    raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? raw.stationName ?? "";
  const stationName = sanitizeName(stationNameFull);

  return {
    code: String(
      raw.stn_cd ?? raw.STN_CD ?? raw.station_cd ?? raw.code ?? raw.stationCode ?? ""
    ).trim(),
    name: stationName,
    facilityName: raw.elvtr_nm ?? raw.ELVTR_NM ?? "",
    kind: raw.elvtr_se ?? raw.ELVTR_SE ?? "",
    location: raw.instl_pstn ?? raw.INSTL_PSTN ?? "",
    oprSec: raw.opr_sec ?? raw.OPR_SEC ?? "",
    status: koStatus(raw.use_yn ?? raw.USE_YN ?? ""),
    line: normalizeLine(raw.line ?? raw.LINE_NUM ?? ""),
  };
}

const RAW_ROWS = pickArray(rawJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map();
for (const r of PRETTY) {
  const key = r.name;
  if (!key) continue;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

export function getElevEsByName(stationName, type) {
  const key = sanitizeName(stationName);
  if (!key) return [];
  const rows = INDEX_BY_NAME.get(key) || [];
  if (!type) return rows.slice();
  return rows.filter((r) => r.kind === type);
}

export function prettifyElevEs(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.name}-${r.kind}-${i}`,
    title: r.kind === "EV" ? "엘리베이터" : r.kind === "ES" ? "에스컬레이터" : "시설",
    desc: [
      r.location ? `위치: ${r.location}` : "",
      r.oprSec ? `운행: ${r.oprSec}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    status: r.status,
    line: r.line || fallbackLine,
  }));
}

export function getFacilityForStation(stationName, type) {
  const rows = getElevEsByName(stationName, type);
  return prettifyElevEs(rows);
}

export { sanitizeName, koStatus, normalizeLine };
