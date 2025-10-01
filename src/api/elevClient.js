// src/api/elevClient.js

// Supabase Edge Function (네가 쓰는 엔드포인트)
const BASE_URL =
  "https://rclzaufogrtqicfvvazz.supabase.co/functions/v1/elev-status";

// 원본(API) → 내부 표준 스키마로 변환
// - 다양한 키 형태를 흡수해서 일관된 키로 반환한다.
function mapElevRow(raw = {}) {
  // 서울시 API 원형 키
  const STN_CD = raw.STN_CD ?? raw.stationCode ?? raw.code ?? raw.id ?? null;
  const STN_NM = raw.STN_NM ?? raw.stationName ?? raw.name ?? raw.title ?? "";
  const LINE =
    raw.LINE ?? raw.line ?? raw.lineName ?? raw.route ?? (raw?.ln || "");

  const ELVTR_NM = raw.ELVTR_NM ?? raw.facilityName ?? "";
  const OPR_SEC = raw.OPR_SEC ?? raw.section ?? "";
  const INSTL_PSTN = raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const USE_YN = raw.USE_YN ?? raw.status ?? "";
  const ELVTR_SE = raw.ELVTR_SE ?? raw.kind ?? "";

  return {
    // 앱 내부 표준 키
    code: typeof STN_CD === "string" ? STN_CD.trim() : STN_CD,
    name: typeof STN_NM === "string" ? STN_NM.trim() : "",
    line: typeof LINE === "string" ? LINE.trim() : "",

    facilityName: ELVTR_NM || "-",
    section: OPR_SEC || "-",
    location: INSTL_PSTN || "-",
    // USE_YN: 'Y' or 'N' 이거나 이미 한글상태일 수도.
    status:
      USE_YN === "Y"
        ? "운행중"
        : USE_YN === "N"
        ? "중지"
        : typeof USE_YN === "string"
        ? USE_YN
        : "-",
    // kind: EV(엘리베이터) / ES(에스컬레이터) 등
    kind: ELVTR_SE || "-",
  };
}

function mapElevRows(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(mapElevRow);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  // Supabase Edge Functions는 200이어도 내부 ok가 false일 수 있으니 둘 다 체크
  const json = await res.json();
  return json;
}

/**
 * 코드로 조회 (예: "0158")
 * 반환: { ok: boolean, rows: Array<InternalRow>, error?: string }
 */
export async function getElevByCode(code) {
  if (!code) return { ok: false, rows: [], error: "역 코드가 없습니다." };
  const url = `${BASE_URL}?code=${encodeURIComponent(code)}`;
  const json = await fetchJSON(url);

  if (!json?.ok) {
    return { ok: false, rows: [], error: json?.error || "요청 실패" };
  }
  return { ok: true, rows: mapElevRows(json.rows || []) };
}

/**
 * 역명으로 조회 (예: "종각")
 * 반환: { ok: boolean, rows: Array<InternalRow>, error?: string }
 */
export async function getElevByName(name) {
  if (!name) return { ok: false, rows: [], error: "역명이 없습니다." };
  const url = `${BASE_URL}?name=${encodeURIComponent(name)}`;
  const json = await fetchJSON(url);

  if (!json?.ok) {
    return { ok: false, rows: [], error: json?.error || "요청 실패" };
  }
  return { ok: true, rows: mapElevRows(json.rows || []) };
}

/**
 * 사용자에게 보여줄 문자열로 예쁘게 출력
 * 내부 표준 스키마 배열을 받아서 멀티라인 텍스트 생성
 */
export function prettify(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "⚠️ 데이터가 없습니다.";
  return rows
    .map((r) => {
      const kind =
        r.kind === "EV" ? "엘리베이터" : r.kind === "ES" ? "에스컬레이터" : r.kind || "-";
      return (
        `🚉 ${r.name} (${r.code ?? "-"})\n` +
        `- 시설명: ${r.facilityName}\n` +
        `- 위치: ${r.location}\n` +
        `- 구간: ${r.section}\n` +
        `- 상태: ${r.status}\n` +
        `- 종류: ${kind}`
      );
    })
    .join("\n\n");
}
