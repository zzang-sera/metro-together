// ✅ src/api/metro/nursingRoomLocal.js
// Source:
//   src/assets/metro-data/metro/babyroom/서울교통공사_수유실현황_20250924.json

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

function sanitizeName(s = "") {
  if (typeof s !== "string") return "";
  return s.replace(/\s*\(\s*\d+\s*호선\s*\)\s*$/g, "").replace(/역$/, "").trim();
}

/* ---------------------- 키 매핑 ---------------------- */
const K = {
  seq: "연번",
  line: "호선",
  name: "역명",
  address: "주소",
  location: "상세위치",
  type: "시설구분",
  area: "면적(제곱미터)",
  seat: "비품(2인용 소파)",
  table: "비품(탁자)",
  year: "조성연도",
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
    address: String(raw[K.address] ?? "").trim(),
    type: String(raw[K.type] ?? "").trim(),
    area: String(raw[K.area] ?? "").trim(),
    seat: String(raw[K.seat] ?? "").trim(),
    table: String(raw[K.table] ?? "").trim(),
    year: String(raw[K.year] ?? "").trim(),
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
export function getNursingRoomsByName(stationName) {
  const k = sanitizeName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function prettifyNursingRooms(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.stationName}-nursing-${r.seq || i}`,
    title: r.type || "수유실",
    desc: [
      r.location,
      r.area ? `${r.area}㎡` : "",
      r.table === "O" ? "탁자 있음" : "",
      r.seat === "O" ? "소파 있음" : "",
      r.year ? `조성연도: ${r.year}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    status: "정상",
    line: r.line || fallbackLine,
  }));
}

export function getNursingRoomsForStation(stationName, fallbackLine = "") {
  const rows = getNursingRoomsByName(stationName);
  return prettifyNursingRooms(rows, fallbackLine);
}
