// src/api/elevator.js
const SEOUL_KEY = process.env.EXPO_PUBLIC_SEOUL_KEY;

async function seoulFetchJson(url) {
  const res = await fetch(encodeURI(url));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Seoul OpenAPI ${res.status}: ${text || url}`);
  }
  return res.json();
}

function normalizeStationName(name = '') {
  return name.replace(/역$/, '').trim();
}

const SERVICE_EL = 'tbTraficElvtr';

export async function fetchElevatorLocations(start = 1, end = 1000) {
  if (!SEOUL_KEY) throw new Error('EXPO_PUBLIC_SEOUL_KEY 가 설정되지 않았습니다.');
  const url = `http://openapi.seoul.go.kr:8088/5867534c736e6f6f31313072797a4941/json/tbTraficElvtr/1/1000/
firebase functions:secrets:set SEOUL_OPENAPI_KEY`;
  const json = await seoulFetchJson(url);
  const root = json?.[SERVICE_EL];
  if (!root) {
    const msg = json?.RESULT?.MESSAGE || 'Unknown response';
    throw new Error(`Invalid response: ${msg}`);
  }
  const rows = root.row ?? [];
  return rows.map(normalizeElevatorRow);
}

export async function fetchElevatorAll() {
  if (!SEOUL_KEY) throw new Error('EXPO_PUBLIC_SEOUL_KEY 가 설정되지 않았습니다.');
  const firstUrl = `http://openapi.seoul.go.kr:8088/5867534c736e6f6f31313072797a4941/json/tbTraficElvtr/1/1000/
firebase functions:secrets:set SEOUL_OPENAPI_KEY`;
  const firstJson = await seoulFetchJson(firstUrl);
  const total = firstJson?.[SERVICE_EL]?.list_total_count ?? 0;
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

export async function fetchElevatorByStation(stationName) {
  const name = normalizeStationName(stationName);
  const all = await fetchElevatorLocations(1, 1000);
  const exact = all.filter((x) => x.station === name);
  if (exact.length) return exact;
  return all.filter((x) => x.station?.includes(name));
}

function normalizeElevatorRow(it = {}) {
  return {
    station: it.STATION_NM ?? it.역명 ?? '',
    line: it.LINE ?? it.호선 ?? '',
    lat: num(it.LAT ?? it.위도),
    lng: num(it.LNG ?? it.경도),
    exitNo: it.EXIT_NO ?? it.출구번호 ?? '',
    detail: it.DETAIL ?? it.상세위치 ?? '',
  };
}
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : undefined; }

export async function summarizeElevators(stationName, max = 4) {
  const list = await fetchElevatorByStation(stationName);
  if (!list.length) return `${stationName}역 엘리베이터 데이터를 찾지 못했습니다.`;
  const normalize = (s) => s.replace(/역$/, '').trim();
  const lines = list.slice(0, max).map((x) => {
    const exit = x.exitNo ? `${x.exitNo}번 출구` : '출구번호 미상';
    return `${exit} · ${x.detail || '상세위치 미상'}${x.line ? ` · ${x.line}` : ''}`;
  });
  return `${normalize(stationName)}역 엘리베이터 위치\n${lines.join('\n')}`;
}
