// src/api/metro/voiceLocal.js
// Source:
//   src/assets/metro-data/metro/voice/서울교통공사 지하철 시각장애인 음성유도기 설치 위치 정보_20250812.json

import voiceJson from "../../assets/metro-data/metro/voice/서울교통공사 지하철 시각장애인 음성유도기 설치 위치 정보_20250812.json";
// station 데이터에서 stationCode(내부) -> 외부역번호(FR_CODE) 매핑을 얻는다.
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";

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

// "서울역 (1)" / "서울역(1)" → "서울역"
function sanitizeName(s = "") {
  if (typeof s !== "string") return "";
  return s
    .replace(/\s*\(\s*\d+\s*\)\s*$/g, "")
    .trim();
}

function toLineLabel(v) {
  if (v == null) return "";
  const n = Number(v);
  if (!Number.isNaN(n) && n > 0) return `${n}호선`;
  const s = String(v).trim();
  return /\d+호선$/.test(s) ? s : s;
}

/* ---------------------- 정규화 ---------------------- */
const K = {
  seq: "연번",
  line: "호선",
  extCode: "외부역번호",
  name: "역명",
  location: "설치위치",
};

function toPretty(raw) {
  const stationNameFull = String(raw[K.name] ?? "").trim();
  const stationName = sanitizeName(stationNameFull);

  return {
    seq: raw[K.seq] ?? "",
    line: toLineLabel(raw[K.line]),
    stationName,
    stationNameRaw: stationNameFull,
    externalCode: String(raw[K.extCode] ?? "").trim(), // 문자열 통일
    location: String(raw[K.location] ?? "").trim(),
  };
}

/* ---------------------- 인덱스 ---------------------- */
const RAW_ROWS = pickArray(voiceJson);
const PRETTY = RAW_ROWS.map(toPretty);

// 1) 역명 인덱스
const INDEX_BY_NAME = new Map(); // stationName → rows[]
for (const r of PRETTY) {
  const key = r.stationName;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

// 2) 외부역번호(FR_CODE) 인덱스
const INDEX_BY_EXT = new Map(); // externalCode(string) → rows[]
for (const r of PRETTY) {
  const key = r.externalCode;
  if (!key) continue;
  const arr = INDEX_BY_EXT.get(key) || [];
  arr.push(r);
  INDEX_BY_EXT.set(key, arr);
}

// 3) 내부 stationCode(예: 0150) → 외부역번호(FR_CODE, 예: 133) 매핑
const ST_ROWS = pickArray(stationJson);
const MAP_STCODE_TO_EXT = new Map();
/*
  흔히 쓰이는 키 후보:
  - station_cd / stn_cd / code : 내부역코드(문자열/숫자)
  - fr_code / FR_CODE / 외부역번호 : 외부역번호
*/
for (const s of ST_ROWS) {
  const stCode =
    s.station_cd ?? s.stn_cd ?? s.code ?? s.stationCode ?? s.STN_CD ?? s.STATION_CD;
  const fr =
    s.fr_code ?? s.FR_CODE ?? s.external_code ?? s.외부역번호 ?? s.ext_code ?? s.EXT_CODE;

  const k = String(stCode ?? "").trim();
  const v = String(fr ?? "").trim();

  if (k && v) {
    MAP_STCODE_TO_EXT.set(k, v);
  }
}

/* ---------------------- 공개 API ---------------------- */
export function getAudioBeaconsByName(stationName) {
  const k = sanitizeName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function getAudioBeaconsByExternalCode(extCode) {
  const k = String(extCode || "").trim();
  if (!k) return [];
  return (INDEX_BY_EXT.get(k) || []).slice();
}

/**
 * 화면 바인딩용 간편 구조로 맵핑
 */
export function prettifyBeacons(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.stationName}-${r.externalCode ?? "X"}-${r.seq ?? i}`,
    title: "음성 유도기",
    desc: [r.location, r.externalCode ? `외부역번호: ${r.externalCode}` : ""]
      .filter(Boolean)
      .join(" · "),
    status: "정상",                   // 실시간 상태 없음 → 기본값
    line: r.line || fallbackLine,     // 라벨 보정
  }));
}

/**
 * 단일 진입점: 우선순위로 찾기
 * 1) stationCode → 외부역번호 변환이 되면 EXT로 조회
 * 2) 실패 시 역명으로 조회
 */
export function getAudioBeaconsForStation(stationName, fallbackLine = "", stationCode = "") {
  const ext = MAP_STCODE_TO_EXT.get(String(stationCode || "").trim());
  if (ext) {
    const byExt = getAudioBeaconsByExternalCode(ext);
    if (byExt.length) return prettifyBeacons(byExt, fallbackLine);
  }
  const byName = getAudioBeaconsByName(stationName);
  return prettifyBeacons(byName, fallbackLine);
}
