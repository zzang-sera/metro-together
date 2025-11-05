
import rawJson from "../../assets/metro-data/metro/lostandFound/서울교통공사_물품보관함 위치정보_20240930.json";

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
  if (typeof s !== "string") return "";
  let out = s.replace(/\s*\(\s*\d+\s*\)\s*$/g, "");
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
      raw.역명 ?? raw["역명"] ?? boxName
    );

  return {
    seq: String(raw[K.seq] ?? "").trim(),
    line: toLineLabel(raw[K.line]),
    stationName,                    
    boxName,                         
    location: String(raw[K.detail] ?? "").trim(), 
  };
}

const RAW_ROWS = pickArray(rawJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map(); 
for (const r of PRETTY) {
  const key = r.stationName;
  if (!key) continue;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

export function getLockersByName(stationName) {
  const k = sanitizeStationName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function prettifyLockers(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.stationName}-${r.boxName || "box"}-${r.seq || i}`,
    title: r.boxName || "물품보관함",
    desc: r.location || "",
    status: "정상",                 
    line: r.line || fallbackLine,   
  }));
}

export function getLockersForStation(stationName, fallbackLine = "") {
  return prettifyLockers(getLockersByName(stationName), fallbackLine);
}
