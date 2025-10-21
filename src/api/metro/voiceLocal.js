// src/api/voiceLocal.js
import rawJson from "../../assets/metro-data/metro/voice/서울교통공사 지하철 시각장애인 음성유도기 설치 위치 정보_20250812.json";

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

/* ---------------------- 정규화 ---------------------- */
const RAW_ROWS = pickArray(rawJson);

function toPretty(raw) {
  return {
    stationName: sanitizeStationName(raw["역명"]),
    line: `${raw["호선"] || ""}호선`,
    location: raw["설치위치"] || "",
  };
}

const PRETTY = RAW_ROWS.map(toPretty);

/* ---------------------- 공개 API ---------------------- */
export function getVoiceGuidesForStation(stationName, fallbackLine = "") {
  const key = sanitizeStationName(stationName || "");
  if (!key) return [];
  const matches = PRETTY.filter((r) => r.stationName.includes(key));
  return matches.map((r, i) => ({
    id: `${r.stationName}-VC-${i}`,
    title: "시각장애인 음성유도기",
    desc: r.location || "설치 위치 정보 없음",
    status: "정상",
    line: r.line || fallbackLine,
  }));
}
