// src/api/metro/lockerLocal.js
// Source:
//   src/assets/metro-data/metro/lostandFound/서울교통공사_물품보관함 위치정보_20240930.json

import rawJson from "../../assets/metro-data/metro/lostandFound/서울교통공사_물품보관함 위치정보_20240930.json";

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

// "서울역(1)" / "서울역 (1)" / "서울역1~22" → "서울역"
function sanitizeStationName(s = "") {
  if (typeof s !== "string") return "";
  // 괄호 숫자 제거
  let out = s.replace(/\s*\(\s*\d+\s*\)\s*$/g, "");
  // 숫자/틸드/공백 등 뒤쪽 장식 제거 (예: "서울역1~22")
  out = out.replace(/[\d~\-\s]+$/g, "");
  return out.trim();
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
  name: "보관함명",
  detail: "상세위치",
};

function toPretty(raw) {
  const boxName = String(raw[K.name] ?? "").trim();
  const stationName =
    sanitizeStationName(
      // 역명이 따로 있으면 최우선 사용
      raw.역명 ?? raw["역명"] ?? boxName
    );

  return {
    seq: String(raw[K.seq] ?? "").trim(),
    line: toLineLabel(raw[K.line]),
    stationName,                     // 정규화된 역명
    boxName,                         // 보관함명 전체 ("서울역1~22")
    location: String(raw[K.detail] ?? "").trim(), // 상세위치
  };
}

/* ---------------------- 인덱스 ---------------------- */
const RAW_ROWS = pickArray(rawJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map(); // stationName → rows[]
for (const r of PRETTY) {
  const key = r.stationName;
  if (!key) continue;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

/* ---------------------- 공개 API ---------------------- */
export function getLockersByName(stationName) {
  const k = sanitizeStationName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

// 화면 바인딩용
export function prettifyLockers(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    // key 충돌 방지: 역명 + 보관함명 + 연번/인덱스
    id: `${r.stationName}-${r.boxName || "box"}-${r.seq || i}`,
    title: r.boxName || "물품보관함",
    desc: r.location || "",
    status: "정상",                 // 실시간 상태 없음
    line: r.line || fallbackLine,   // 라인 라벨 보정
  }));
}

export function getLockersForStation(stationName, fallbackLine = "") {
  return prettifyLockers(getLockersByName(stationName), fallbackLine);
}
