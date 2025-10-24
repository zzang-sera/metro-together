// src/api/metro/wheelchairLiftLocal.js
// Source:
//   src/assets/metro-data/metro/wheelchairLift/서울교통공사_휠체어리프트 설치현황_20250310.json

import liftJson from "../../assets/metro-data/metro/wheelchairLift/서울교통공사_휠체어리프트 설치현황_20250310.json";

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

// "신설동(1)" / "신설동 (1)" → "신설동"
function sanitizeName(s = "") {
  return typeof s === "string"
    ? s.replace(/\s*\(\s*\d+\s*\)\s*$/g, "").trim()
    : "";
}

/* ---------------------- 키 맵 ---------------------- */
const K = {
  seq: "연번",
  line: "호선",
  name: "역명",
  manageNo: "관리번호(호기)",
  nearGate: "(근접) 출입구번호",
  sGround: "시작층(지상_지하)",
  sLevel: "시작층(운행역층)",
  sDetail: "시작층(상세위치)",
  eGround: "종료층(지상_지하)",
  eLevel: "종료층(운행역층)",
  eDetail: "종료층(상세위치)",
  length: "길이",
  width: "폭",
  limitWeight: "한계중량",
  serial: "승강기 일련번호",
  date: "데이터 기준일자",
};

function toPretty(raw) {
  const stationNameFull = String(raw[K.name] ?? "").trim();
  const stationName = sanitizeName(stationNameFull);

  const sGround = String(raw[K.sGround] ?? "").trim();
  const sLevel = raw[K.sLevel];
  const sDetail = String(raw[K.sDetail] ?? "").trim();

  const eGround = String(raw[K.eGround] ?? "").trim();
  const eLevel = raw[K.eLevel];
  const eDetail = String(raw[K.eDetail] ?? "").trim();

  const startTxt = [sGround, sLevel ? `${sLevel}층` : "", sDetail].filter(Boolean).join(" ");
  const endTxt   = [eGround, eLevel ? `${eLevel}층` : "", eDetail].filter(Boolean).join(" ");

  return {
    seq: raw[K.seq] ?? "",
    line: String(raw[K.line] ?? "").trim(), // 보통 "1호선" 형태
    stationName,
    stationNameRaw: stationNameFull,
    manageNo: String(raw[K.manageNo] ?? "").trim(),
    nearGate: String(raw[K.nearGate] ?? "").trim(),
    start: startTxt,
    end: endTxt,
    length: raw[K.length] ?? "",
    width: raw[K.width] ?? "",
    limitWeight: raw[K.limitWeight] ?? "",
    serial: String(raw[K.serial] ?? "").trim(),
    date: String(raw[K.date] ?? "").trim(),
  };
}

/* ---------------------- 인덱스 ---------------------- */
const RAW_ROWS = pickArray(liftJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map(); // stationName → rows[]
for (const r of PRETTY) {
  const key = r.stationName;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

/* ---------------------- 공개 API ---------------------- */
export function getWheelchairLiftsByName(stationName) {
  const k = sanitizeName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function prettifyWheelchairLifts(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    // key 충돌 방지: 역명 + 관리번호/serial + seq
    id: `${r.stationName}-${r.manageNo || r.serial || "X"}-${r.seq ?? i}`,
    title: "휠체어 리프트",
    desc: [
      r.start && r.end ? `${r.start} ↔ ${r.end}` : r.start || r.end,
      r.nearGate ? `출입구: ${r.nearGate}` : "",
      r.width ? `폭: ${r.width}mm` : "",
      r.limitWeight ? `허용중량: ${r.limitWeight}kg` : "",
      r.serial ? `SN: ${r.serial}` : "",
    ].filter(Boolean).join(" · "),
    status: "정상",                // 실시간 상태 없음 → 기본값
    line: r.line || fallbackLine,
  }));
}

export function getWheelchairLiftsForStation(stationName, fallbackLine = "") {
  const rows = getWheelchairLiftsByName(stationName);
  return prettifyWheelchairLifts(rows, fallbackLine);
}
