// src/api/metro/nursingRoomLocal.js
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

// "종로3가역(1호선)" / "서울역 (1)" → "종로3가" / "서울역"
function sanitizeStationName(s = "") {
  if (typeof s !== "string") return "";
  let out = s.replace(/\s*\(\s*\d+\s*호선\s*\)\s*$/g, ""); // (1호선) 제거
  out = out.replace(/\s*\(\s*\d+\s*\)\s*$/g, "");          // (1) 변종 제거
  out = out.trim();
  // 끝의 '역' 제거 (예: "종로3가역" → "종로3가")
  out = out.replace(/역$/, "").trim();
  return out;
}

function toLineLabel(v) {
  if (v == null) return "";
  const s = String(v).trim();
  const n = Number(s.replace("호선", ""));
  if (!Number.isNaN(n) && n > 0) return `${n}호선`;
  return /\d+호선$/.test(s) ? s : s;
}

/* ---------------------- 키 맵 ---------------------- */
const K = {
  seq: "연번",
  line: "호선",
  name: "역명",
  addr: "주소",
  where: "상세위치",
  year: "조성연도",
  area: "면적(제곱미터)",
  roomType: "시설구분",
  paid: "운임 비운임",            // "운임" / "비운임"
  via: "고객안전실 경유",         // "단독" / "경유"
  // 비품(*) 들은 동적으로 처리
};

// 비품 키를 스캔해 사람이 읽기 좋은 라벨로 변환
function extractEquipments(raw) {
  const equips = [];
  for (const key of Object.keys(raw)) {
    if (!/^비품\(/.test(key)) continue;
    const label = key.replace(/^비품\(/, "").replace(/\)$/, "").trim(); // 괄호 안 텍스트
    const val = raw[key];
    if (val === "O") equips.push(label);
    else if (typeof val === "number" && val > 0) equips.push(`${label}(x${val})`);
    // "X"나 0, 비어있음 등은 스킵
  }
  return equips;
}

function toPretty(raw) {
  const stationNameFull = String(raw[K.name] ?? "").trim();
  const stationName = sanitizeStationName(stationNameFull);

  const line = toLineLabel(raw[K.line]);
  const where = String(raw[K.where] ?? "").trim();
  const roomType = String(raw[K.roomType] ?? "").trim();
  const paid = String(raw[K.paid] ?? "").trim();     // 운임/비운임
  const via = String(raw[K.via] ?? "").trim();       // 단독/경유
  const area = raw[K.area];

  const equipments = extractEquipments(raw);

  return {
    seq: String(raw[K.seq] ?? "").trim(),
    line,
    stationName,
    stationNameRaw: stationNameFull,
    address: String(raw[K.addr] ?? "").trim(),
    location: where,
    roomType,
    paid,      // "운임" 또는 "비운임"
    via,       // "단독" / "경유"
    area,      // 숫자면 ㎡ 표시
    equipments, // 배열
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
export function getNursingRoomsByName(stationName) {
  const k = sanitizeStationName(stationName || "");
  if (!k) return [];
  return (INDEX_BY_NAME.get(k) || []).slice();
}

export function prettifyNursingRooms(rows, fallbackLine = "") {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r, i) => {
    const parts = [
      r.location,                    // 상세위치
      r.roomType ? `구분: ${r.roomType}` : "",
      r.paid ? `${r.paid}` : "",
      r.via ? `경유: ${r.via}` : "",
      (typeof r.area === "number" && !Number.isNaN(r.area)) ? `면적: ${r.area}㎡` : "",
      r.equipments?.length ? `비품: ${r.equipments.join(", ")}` : "",
    ].filter(Boolean);

    return {
      // key 충돌 방지: 역명 + 연번/인덱스
      id: `${r.stationName}-nursing-${r.seq || i}`,
      title: "수유실",
      desc: parts.join(" · "),
      status: "정상",                // 실시간 상태 없음
      line: r.line || fallbackLine,
    };
  });
}

export function getNursingRoomsForStation(stationName, fallbackLine = "") {
  const rows = getNursingRoomsByName(stationName);
  return prettifyNursingRooms(rows, fallbackLine);
}
