// ✅ src/api/metro/toiletLocal.js
// Source:
//   src/assets/metro-data/metro/toilets/서울교통공사_역사공중화장실정보_20241127.json

import rawJson from "../../assets/metro-data/metro/toilets/서울교통공사_역사공중화장실정보_20241127.json";

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
  address: "소재지도로명주소",
  location: "상세위치",
  gate: "(근접) 출입구 번호",
  floor: "역층",
  openTime: "개방시간",
  maleToilet: "남성용-대변기수",
  femaleToilet: "여성용-대변기수",
  cctv: "화장실입구cctv설치유무",
  bell: "비상벨 설치유무",
};

/* ---------------------- 변환 ---------------------- */
function toPretty(raw) {
  const stationNameFull = String(raw[K.name] ?? "").trim();
  const stationName = sanitizeName(stationNameFull);

  const hasBabyTable =
    raw["기저귀교환대설치유무-남자화장실"] === "Y" ||
    raw["기저귀교환대설치유무-남자장애인화장실"] === "Y" ||
    raw["기저귀교환대설치유무-여자화장실"] === "Y" ||
    raw["기저귀교환대설치유무-여자장애인화장실"] === "Y";

  return {
    seq: String(raw[K.seq] ?? ""),
    line: String(raw[K.line] ?? "").trim(),
    stationName,
    stationNameRaw: stationNameFull,
    address: String(raw[K.address] ?? "").trim(),
    location: String(raw[K.location] ?? "").trim(),
    gate: String(raw[K.gate] ?? "").trim(),
    floor: String(raw[K.floor] ?? "").trim(),
    openTime: String(raw[K.openTime] ?? "").trim(),
    maleToilet: String(raw[K.maleToilet] ?? "").trim(),
    femaleToilet: String(raw[K.femaleToilet] ?? "").trim(),
    cctv: String(raw[K.cctv] ?? "").trim(),
    bell: String(raw[K.bell] ?? "").trim(),
    hasBabyTable, 
  };
}

/* ---------------------- 인덱스 ---------------------- */
const RAW_ROWS = pickArray(rawJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map();
for (const r of PRETTY) {
  const key = r.stationName;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

/* ---------------------- 공개 API ---------------------- */
export function getToiletsByName(stationName) {
  const k = sanitizeName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function prettifyToilets(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.stationName}-toilet-${r.seq || i}`,
    title: "화장실",
    desc: [
      r.location,
      r.gate ? `출입구: ${r.gate}` : "",
      r.floor ? `${r.floor}층` : "",
      r.openTime ? `운영시간: ${r.openTime}` : "",
      r.hasBabyTable ? "기저귀교환대 있음" : "", 
      r.bell === "Y" ? "비상벨 있음" : "",
      r.cctv === "Y" ? "입구 CCTV" : "",
    ]
      .filter(Boolean)
      .join(" · "),
    status: "정상",
    line: r.line || fallbackLine,
  }));
}

export function getToiletsForStation(stationName, fallbackLine = "") {
  const rows = getToiletsByName(stationName);
  return prettifyToilets(rows, fallbackLine);
}
