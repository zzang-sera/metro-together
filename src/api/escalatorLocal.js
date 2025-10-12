// src/api/escalatorLocal.js
// Source: src/assets/metro-data/metro/escalator/서울교통공사_에스컬레이터 설치 정보_20250310.json

import escJson from "../assets/metro-data/metro/escalator/서울교통공사_에스컬레이터 설치 정보_20250310.json";

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

// "서울역(1)" → "서울역"
function sanitizeName(s = "") {
  return typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";
}

// 안전 접근 도우미(한글 키 포함)
const K = {
  line: "호선",
  name: "역  명",
  manageNo: "관리번호(호기)",
  direction: "상하행구분",
  nearGate: "(근접)출입구번호",
  startGround: "시작층(지상_지하)",
  startLevel: "시작층(운행역층)",
  startDetail: "시작층(상세위치)",
  endGround: "종료층(지상_지하)",
  endLevel: "종료층(운행역층)",
  endDetail: "종료층(상세위치)",
  width: "승강기형폭",
  serial: "승강기 일련번호",
  date: "데이터 기준일자",
};

function toPretty(raw) {
  const line = String(raw[K.line] ?? "").trim();
  const stationNameFull = String(raw[K.name] ?? "").trim();
  const stationName = sanitizeName(stationNameFull);

  const manageNo = raw[K.manageNo] ?? "";
  const direction = String(raw[K.direction] ?? "").trim(); // "상행"/"하행"
  const nearGate = String(raw[K.nearGate] ?? "").trim();   // "내부", "1", "2-1" 등

  const sGround = String(raw[K.startGround] ?? "").trim(); // 지상/지하
  const sLevel = raw[K.startLevel] ?? "";
  const sDetail = String(raw[K.startDetail] ?? "").trim();

  const eGround = String(raw[K.endGround] ?? "").trim();
  const eLevel = raw[K.endLevel] ?? "";
  const eDetail = String(raw[K.endDetail] ?? "").trim();

  const width = raw[K.width] ?? "";
  const serial = String(raw[K.serial] ?? "").trim();
  const date = String(raw[K.date] ?? "").trim();

  // human-friendly
  const startTxt = [sGround, sLevel ? `${sLevel}층` : "", sDetail].filter(Boolean).join(" ");
  const endTxt   = [eGround, eLevel ? `${eLevel}층` : "", eDetail].filter(Boolean).join(" ");

  return {
    line,
    stationName,
    stationNameRaw: stationNameFull,
    manageNo,
    direction,    // 상행/하행
    nearGate,     // (근접)출입구번호
    start: startTxt,
    end: endTxt,
    width,        // mm
    serial,
    date,
  };
}

/* ---------------------- 인덱스 ---------------------- */
const RAW_ROWS = pickArray(escJson);
const PRETTY = RAW_ROWS.map(toPretty);

const INDEX_BY_NAME = new Map(); // stationName(괄호 숫자 제거) → 배열
for (const r of PRETTY) {
  const key = r.stationName;
  const arr = INDEX_BY_NAME.get(key) || [];
  arr.push(r);
  INDEX_BY_NAME.set(key, arr);
}

/* ---------------------- 공개 API ---------------------- */
// 역명으로 원본(정규화된) 배열 반환
export function getEscalatorsByName(stationName) {
  const k = sanitizeName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

// 화면 바인딩용 간편 구조로 맵핑
export function prettifyEsc(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => ({
    id: `${r.stationName}-${r.serial || r.manageNo || i}`,
    title: `${r.direction || ""} 에스컬레이터`.trim(), // "상행 에스컬레이터"
    desc: [
      r.start && r.end ? `${r.start} ↔ ${r.end}` : r.start || r.end,
      r.nearGate ? `출입구: ${r.nearGate}` : "",
      r.width ? `폭: ${r.width}mm` : "",
      r.serial ? `SN: ${r.serial}` : "",
    ].filter(Boolean).join(" · "),
    status: "정상", // 에스컬레이터 JSON에는 실시간 상태 없음 → 임시 "정상"
    line: r.line || fallbackLine,
  }));
}

// 단일 진입점(역명 문자열만으로)
export function getEscalatorsForStation(stationName, fallbackLine = "") {
  const rows = getEscalatorsByName(stationName);
  return prettifyEsc(rows, fallbackLine);
}
