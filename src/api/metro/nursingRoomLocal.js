// src/api/nursingRoomLocal.js
import rawJson from "../../assets/metro-data/metro/babyroom/서울교통공사_수유실현황_20250924.json";

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

function sanitizeStationName(s = "") {
  return String(s)
    .replace(/\s*\(\s*\d+\s*\)\s*$/g, "")
    .replace(/[\d~\-\s]+$/g, "")
    .trim();
}

function toLineLabel(v) {
  const n = Number(v);
  if (!Number.isNaN(n) && n > 0) return `${n}호선`;
  const s = String(v).trim();
  return /\d+호선$/.test(s) ? s : s;
}

/* ---------------------- 정규화 ---------------------- */
const RAW_ROWS = pickArray(rawJson);

function toPretty(raw) {
  const stationName = sanitizeStationName(raw["역명"] ?? "");
  return {
    line: toLineLabel(raw["호선"]),
    stationName,
    location: raw["상세위치"] || "",
    facilityType: raw["시설구분"] || "수유실",
    year: raw["조성연도"] || "",
  };
}

const PRETTY = RAW_ROWS.map(toPretty);

/* ---------------------- 공개 API ---------------------- */
export function getNursingRoomsForStation(stationName, fallbackLine = "") {
  const key = sanitizeStationName(stationName || "");
  if (!key) return [];
  const matches = PRETTY.filter((r) => r.stationName.includes(key));
  return matches.map((r, i) => ({
    id: `${r.stationName}-NR-${i}`,
    title: "수유실",
    desc: r.location || "위치 정보 없음",
    status: "정상",
    line: r.line || fallbackLine,
  }));
}
