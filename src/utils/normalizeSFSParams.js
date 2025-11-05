// src/utils/normalizeSFSParams.js
export function normalizeSFSParams(raw = {}) {
  const nameRaw = raw.name ?? raw.stationName ?? raw.title ?? raw.label ?? '';
  const lineRaw = raw.line ?? raw.lineName ?? raw.route ?? '';
  const codeRaw = raw.code ?? raw.stationCode ?? raw.id ?? null;

  const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
  const line = typeof lineRaw === 'string' ? lineRaw.trim() : '';
  let code = (typeof codeRaw === 'string' ? codeRaw.trim() : codeRaw) || null;

  return { name, line, code };
}
