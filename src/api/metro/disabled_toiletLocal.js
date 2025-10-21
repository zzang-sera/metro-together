// ✅ src/api/metro/disabled_toiletLocal.js
// Source:
//   src/assets/metro-data/metro/disabled_toilets/서울교통공사_역사장애인화장실정보_20241127.json

import rawJson from "../../assets/metro-data/metro/disabled_toilets/서울교통공사_역사장애인화장실정보_20241127.json";

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

function sanitizeName(s = "") {
  if (typeof s !== "string") return "";
  return s.replace(/\s*\(\s*\d+\s*호선\s*\)\s*$/g, "").replace(/역$/, "").trim();
}

/* ---------------------- 키 매핑 ---------------------- */
const K = {
  seq: "연번",
  line: "운영노선명",
  name: "역명",
  location: "상세위치",
  floor: "역층",
  gate: "(근접) 출입구 번호",
  time: "개방시간",
  phone: "전화번호",
  remodel: "리모델링 연도",
  maleToilet: "남성용-대변기수",
  femaleToilet: "여성용-대변기수",
  babyTableMale: "기저귀교환대설치유무-남자장애인화장실",
  babyTableFemale: "기저귀교환대설치유무-여자장애인화장실",
};

/* ---------------------- 변환 ---------------------- */
function toPretty(raw) {
  const stationNameFull = String(raw[K.name] ?? "").trim();
  const stationName = sanitizeName(stationNameFull);

  return {
    seq: String(raw[K.seq] ?? ""),
    line: String(raw[K.line] ?? "").trim(),
    stationName,
    stationNameRaw: stationNameFull,
    location: String(raw[K.location] ?? "").trim(),
    floor: String(raw[K.floor] ?? "").trim(),
    gate: String(raw[K.gate] ?? "").trim(),
    time: String(raw[K.time] ?? "").trim(),
    phone: String(raw[K.phone] ?? "").trim(),
    remodel: String(raw[K.remodel] ?? "").trim(),
    maleToilet: String(raw[K.maleToilet] ?? "").trim(),
    femaleToilet: String(raw[K.femaleToilet] ?? "").trim(),
    babyTableMale: String(raw[K.babyTableMale] ?? "").trim(),
    babyTableFemale: String(raw[K.babyTableFemale] ?? "").trim(),
  };
}

/* ---------------------- 인덱스 ---------------------- */
const RAW_ROWS = pickArray(rawJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map();
for (const r of PRETTY) {
  const arr = INDEX_BY_NAME.get(r.stationName) || [];
  arr.push(r);
  INDEX_BY_NAME.set(r.stationName, arr);
}

/* ---------------------- 공개 API ---------------------- */
export function getDisabledToiletsByName(stationName) {
  const k = sanitizeName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function prettifyDisabledToilets(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.stationName}-disabledToilet-${r.seq || i}`,
    title: "장애인 화장실",
    desc: [
      r.location,
      r.floor ? `${r.floor}층` : "",
      r.gate ? `출입구: ${r.gate}` : "",
      r.time ? `운영시간: ${r.time}` : "",
      r.remodel ? `리모델링: ${r.remodel}` : "",
      r.babyTableMale === "1" || r.babyTableFemale === "1" ? "기저귀교환대 있음" : "",
    ]
      .filter(Boolean)
      .join(" · "),
    status: "정상",
    line: r.line || fallbackLine,
  }));
}

export function getDisabledToiletsForStation(stationName, fallbackLine = "") {
  const rows = getDisabledToiletsByName(stationName);
  return prettifyDisabledToilets(rows, fallbackLine);
}
