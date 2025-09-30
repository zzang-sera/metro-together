// src/api/elevator.js
// 서울 열린데이터광장: tbTraficElvtr (엘리베이터 위치)
// 환경변수: EXPO_PUBLIC_SEOUL_KEY (노출 가능 prefix, Expo 규칙)

const SEOUL_KEY = process.env.EXPO_PUBLIC_SEOUL_KEY;

// 공통 fetch
async function seoulFetchJson(url) {
  const res = await fetch(encodeURI(url));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Seoul OpenAPI ${res.status}: ${text || url}`);
  }
  return res.json();
}

const SERVICE = 'tbTraficElvtr';

// "서울역" → "서울" (…역 제거)
function normalizeStationName(name = '') {
  return String(name).replace(/역$/, '').trim();
}

// 숫자 안전 변환
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// API 응답 한 행 표준화
function normalizeRow(it = {}) {
  return {
    station: it.STATION_NM ?? it.역명 ?? '',
    line: it.LINE ?? it.호선 ?? '',
    lat: num(it.LAT ?? it.위도),
    lng: num(it.LNG ?? it.경도),
    exitNo: it.EXIT_NO ?? it.출구번호 ?? '',
    detail: it.DETAIL ?? it.상세위치 ?? '',
  };
}

/**
 * 구간 호출(1~1000)
 */
export async function fetchElevatorLocations(start = 1, end = 1000) {
  if (!SEOUL_KEY) throw new Error('EXPO_PUBLIC_SEOUL_KEY 가 설정되지 않았습니다.');
  const url = `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/${SERVICE}/${start}/${end}/`;
  const json = await seoulFetchJson(url);

  const root = json?.[SERVICE];
  if (!root) {
    const msg = json?.RESULT?.MESSAGE || 'Unknown response';
    throw new Error(`Invalid response: ${msg}`);
  }

  return (root.row ?? []).map(normalizeRow);
}

/**
 * 전체(1~list_total_count) 자동 수집
 */
export async function fetchElevatorAll() {
  if (!SEOUL_KEY) throw new Error('EXPO_PUBLIC_SEOUL_KEY 가 설정되지 않았습니다.');
  const firstUrl = `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/${SERVICE}/1/1/`;
  const firstJson = await seoulFetchJson(firstUrl);
  const total = firstJson?.[SERVICE]?.list_total_count ?? 0;
  if (!total) return [];

  const chunk = 1000;
  const tasks = [];
  for (let start = 1; start <= total; start += chunk) {
    const end = Math.min(start + chunk - 1, total);
    tasks.push(fetchElevatorLocations(start, end));
  }
  const pages = await Promise.all(tasks);
  return pages.flat();
}

/**
 * 역명으로 필터
 * - 완전일치 우선, 없으면 부분일치
 */
export async function fetchElevatorByStation(stationName) {
  const name = normalizeStationName(stationName);
  // 보통 1000건 이내. 초과하면 fetchElevatorAll()로 교체 가능
  const all = await fetchElevatorLocations(1, 1000);
  const exact = all.filter((x) => normalizeStationName(x.station) === name);
  if (exact.length) return exact;
  return all.filter((x) => normalizeStationName(x.station).includes(name));
}

/**
 * 간단 요약 문자열
 * "1번 출구 · 개찰구 중앙(서측) · 2호선" 형태
 */
export async function summarizeElevators(stationName, max = 4) {
  const name = normalizeStationName(stationName);
  const list = await fetchElevatorByStation(name);
  if (!list.length) return `${name}역 엘리베이터 데이터를 찾지 못했습니다.`;

  const lines = list.slice(0, max).map((x) => {
    const exit = x.exitNo ? `${x.exitNo}번 출구` : '출구번호 미상';
    const loc = x.detail || '상세위치 미상';
    const line = x.line ? ` · ${x.line}` : '';
    return `${exit} · ${loc}${line}`;
  });
  return `${name}역 엘리베이터 위치\n${lines.join('\n')}`;
}
