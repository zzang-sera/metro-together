// ✅ src/api/metro/voiceLocal.js
import voiceJson from "../../assets/metro-data/metro/voice/서울교통공사 지하철 시각장애인 음성유도기 설치 위치 정보_20250812.json";
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";

// 🔹 유틸
function pickArray(any) {
  if (Array.isArray(any)) return any;
  if (any?.DATA && Array.isArray(any.DATA)) return any.DATA;
  if (any?.row && Array.isArray(any.row)) return any.row;
  for (const v of Object.values(any || {})) {
    if (Array.isArray(v)) return v;
    if (v?.row && Array.isArray(v.row)) return v.row;
    if (v?.DATA && Array.isArray(v.DATA)) return v.DATA;
  }
  return [];
}

function sanitizeName(name = "") {
  return String(name).replace(/\(.*\)/g, "").trim();
}

// 🔹 정규화
const RAW = pickArray(voiceJson);
const PRETTY = RAW.map((r) => ({
  seq: String(r["연번"] || ""),
  line: `${r["호선"] || ""}호선`,
  stationName: sanitizeName(r["역명"] || ""),
  externalCode: String(r["외부역번호"] || ""),
  location: String(r["설치위치"] || ""),
}));

// 🔹 인덱스 생성
const INDEX_BY_NAME = new Map();
const INDEX_BY_EXT = new Map();
for (const r of PRETTY) {
  if (r.stationName) {
    const arr = INDEX_BY_NAME.get(r.stationName) || [];
    arr.push(r);
    INDEX_BY_NAME.set(r.stationName, arr);
  }
  if (r.externalCode) {
    const arr = INDEX_BY_EXT.get(r.externalCode) || [];
    arr.push(r);
    INDEX_BY_EXT.set(r.externalCode, arr);
  }
}

// 🔹 stationCode → 외부역번호 매핑
const ST_ROWS = pickArray(stationJson);
const MAP_STCODE_TO_EXT = new Map();
for (const s of ST_ROWS) {
  const stCode = s.station_cd || s.stn_cd || s.code || s.STN_CD;
  const ext = s.fr_code || s.FR_CODE || s.외부역번호;
  if (stCode && ext) MAP_STCODE_TO_EXT.set(String(stCode), String(ext));
}

// ✅ 메인 함수
export function getAudioBeaconsForStation(stationName, line = "", stationCode = "") {
  const ext = MAP_STCODE_TO_EXT.get(String(stationCode));
  const result = ext
    ? INDEX_BY_EXT.get(ext) || []
    : INDEX_BY_NAME.get(sanitizeName(stationName)) || [];

  return (result || []).map((r, i) => ({
    id: `${r.stationName}-${r.externalCode}-${i}`,
    title: "음성유도기",
    desc: `${r.location}${r.externalCode ? ` · 외부역번호:${r.externalCode}` : ""}`,
    status: "정상",
    line: r.line || line,
  }));
}
