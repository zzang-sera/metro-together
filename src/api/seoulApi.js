// src/api/seoulApi.js
// 서울열린데이터포털 공통 헬퍼 (SERVICE 스타일)
// - BASE: http (안드로이드 클리어텍스트 허용 필요), 가능하면 https로 교체
// - SERVICE 예: tbTrafficElvt (지하철역 엘리베이터 '위치' 노드)
// - 표준 응답 파서 + 전페이지 수집(callSeoulAll) 포함

import Constants from 'expo-constants';

/* =========================
   환경설정
   ========================= */
const EXTRA = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
export const SEOUL_KEY = EXTRA.SEOUL_KEY;

// ❗️https가 안 되는 환경(8088/TLS 이슈)에서는 http + usesCleartextTraffic 필요
// app.json → ["expo-build-properties", { "android": { "usesCleartextTraffic": true } }]
// 그리고 개발 빌드(npx expo run:android / EAS dev build)로 실행해야 적용됨.
export const BASE = 'http://openapi.seoul.go.kr:8088';
// 필요하면 이렇게 전환:
// export const BASE = 'https://openapi.seoul.go.kr:8088';

/* =========================
   서비스(데이터셋) 매핑
   ========================= */
export const SeoulServices = {
  // 지하철역 엘리베이터 '위치(노드)' — 좌표/WKT + 역코드/역명 제공
  elevatorLocation: 'tbTrafficElvt',
  // TODO: 엘리베이터 '상태(운행/고장)' 서비스명을 알게 되면 여기에 추가
  // elevatorStatus: '<<확정되면 서비스명 기입>>',
};

/* =========================
   공통 호출자
   ========================= */

// SERVICE 형식 URL 생성
function buildServiceUrl(service, start = 1, end = 1000) {
  if (!SEOUL_KEY) throw new Error('SEOUL_KEY_missing (app.json > expo.extra.SEOUL_KEY)');
  return `${BASE}/${encodeURIComponent(SEOUL_KEY)}/json/${encodeURIComponent(service)}/${start}/${end}`;
}

// 표준 응답에서 row 배열 추출
export function extractRows(json) {
  const topKey = Object.keys(json || {})[0];
  const payload = topKey ? json[topKey] : null;
  if (!payload || typeof payload !== 'object') return [];
  const listKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
  return listKey ? payload[listKey] : [];
}

// 단일 페이지 호출
export async function callSeoul(service, { start = 1, end = 1000 } = {}) {
  const url = buildServiceUrl(service, start, end);
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[SeoulAPI] HTTP ${res.status} ${res.statusText} :: ${text || url}`);
  }
  const data = await res.json();

  // 표준 RESULT 에러 처리
  const topKey = Object.keys(data)[0];
  const payload = data[topKey];
  if (payload?.RESULT?.CODE && payload.RESULT.CODE !== 'INFO-000') {
    throw new Error(`[SeoulAPI] ${payload.RESULT.CODE} ${payload.RESULT.MESSAGE || ''}`);
  }
  return data;
}

// 전 페이지 수집(페이징 자동 루프)
export async function callSeoulAll(service, { chunk = 1000, hardLimit = 100000 } = {}) {
  let start = 1;
  const rows = [];
  for (;;) {
    const end = Math.min(start + chunk - 1, hardLimit);
    const json = await callSeoul(service, { start, end });
    const batch = extractRows(json);
    rows.push(...(batch || []));
    if (!batch || batch.length < (end - start + 1)) break; // 마지막 페이지
    start = end + 1;
  }
  return rows;
}

/* =========================
   엘리베이터 '위치' 전용 헬퍼 (tbTrafficElvt)
   ========================= */

// 전량 수집 (권장: 최초 1회 → 메모리 캐시)
export async function fetchElevatorLocationsAll() {
  return callSeoulAll(SeoulServices.elevatorLocation, { chunk: 1000 });
}

// 기존 화면 호환: fetchStationFacilities({ query: { STATION_CD, STATION_NM, STN_NM } })
// - tbTrafficElvt는 서버측 필터 파라미터가 없으므로, 클라이언트에서 필터링하여
//   "표준형 JSON"으로 다시 감싸 반환한다(row 배열 포함)
export async function fetchStationFacilities({ start = 1, end = 500, query = {} } = {}) {
  // 1) 전량 수집
  const all = await fetchElevatorLocationsAll();

  // 2) 클라 필터 (역코드/역명)
  const code = String(query.STATION_CD ?? '').trim();
  const nm1 = normalizeStationName(query.STATION_NM);
  const nm2 = normalizeStationName(query.STN_NM);

  const filtered = all.filter((r) => {
    const rCode = r.SBWY_STN_CD != null ? String(r.SBWY_STN_CD) : '';
    const rName = (r.SBWY_STN_NM || '').replace(/역$/,'').trim();
    if (code && rCode === code) return true;
    if (nm1 && rName.includes(nm1)) return true;
    if (nm2 && rName.includes(nm2)) return true;
    return false;
  });

  // 3) 페이징 슬라이스(start/end는 1-base)
  const sIdx = Math.max(0, start - 1);
  const eIdx = Math.max(sIdx, Math.min(filtered.length, end));
  const pageRows = filtered.slice(sIdx, eIdx);

  // 4) 표준형 JSON으로 래핑하여 반환(화면의 extractRows 로직 호환)
  return wrapStandardResponse(SeoulServices.elevatorLocation, {
    total: filtered.length,
    rows: pageRows,
  });
}

/* =========================
   유틸
   ========================= */

function normalizeStationName(v) {
  if (!v) return '';
  return String(v).replace(/역$/,'').trim();
}

function wrapStandardResponse(serviceName, { total = 0, rows = [] } = {}) {
  // 서울 OpenAPI의 일반 구조:
  // { SERVICE: { list_total_count, RESULT: { CODE, MESSAGE }, row: [...] } }
  return {
    [serviceName]: {
      list_total_count: total,
      RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다' },
      row: rows,
    },
  };
}

/* =========================
   (선택) 좌표 파서: WKT → "lat, lon" 문자열
   ========================= */
export function parseWKTPoint(wkt = '') {
  const m = /POINT\s*\(\s*([0-9.\-]+)\s+([0-9.\-]+)\s*\)/i.exec(wkt);
  if (!m) return '';
  const lon = Number(m[1]).toFixed(6);
  const lat = Number(m[2]).toFixed(6);
  return `${lat}, ${lon}`;
}

/* =========================
   (미정) 엘리베이터 '상태' 헬퍼 자리
   ========================= */
// export async function fetchElevatorStatus(args) {
//   // TODO: 상태용 SERVICE 이름이 확정되면 구현
//   throw new Error('엘리베이터 상태 API 서비스명이 아직 확정되지 않았습니다.');
// }
