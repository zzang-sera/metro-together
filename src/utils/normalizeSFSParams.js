// src/utils/normalizeSFSParams.js
// SFS(Screen)에서 사용할 파라미터 표준화 + 폴백
export function normalizeSFSParams(raw = {}) {
  const nameRaw = raw.name ?? raw.stationName ?? raw.title ?? raw.label ?? '';
  const lineRaw = raw.line ?? raw.lineName ?? raw.route ?? '';
  const codeRaw = raw.code ?? raw.stationCode ?? raw.id ?? null;

  const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
  const line = typeof lineRaw === 'string' ? lineRaw.trim() : '';
  let code = (typeof codeRaw === 'string' ? codeRaw.trim() : codeRaw) || null;

  // 필요하면 라인+역명으로 code 찾아 채우기 (여기선 빈 배열, 이후 실제 데이터 연결)
  // import로 외부 인덱스를 붙일 계획이라면 여기서 참조해도 됨.
  // ex) const hit = STATION_INDEX.find(s => s.name===name && s.line===line); if (hit) code = hit.code;

  return { name, line, code };
}
