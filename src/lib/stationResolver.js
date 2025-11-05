// src/lib/stationResolver.js
import elevData from "../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json" assert { type: "json" };

function normalizeHangul(str) {
  return str.normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[()\[\]{}]/g, "")
    .replace(/역$/g, "")
    .toLowerCase();
}

function normalizeLine(line) {
  if (!line) return "";
  const m = line.match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : line;
}

function parseStationName(stn_nm) {
  const m = stn_nm.match(/^(.*?)(?:\((\d+)\))?$/);
  const name = (m?.[1] || stn_nm).trim();
  const line = m?.[2] ? `${parseInt(m[2], 10)}호선` : null;
  return { name, line };
}

const byCode = new Map();
const byName = new Map();
const byLineName = new Map();

for (const row of elevData.DATA || []) {
  const code = row.stn_cd?.toString();
  if (!code) continue;

  const { name, line } = parseStationName(row.stn_nm);
  const normName = normalizeHangul(name);
  const normLine = normalizeLine(line);

  if (!byName.has(normName)) byName.set(normName, new Set());
  byName.get(normName).add(code);

  if (normLine) {
    const key = `${normLine}@@${normName}`;
    if (!byLineName.has(key)) byLineName.set(key, code);
  }

  if (!byCode.has(code)) byCode.set(code, row);
}

export function resolveStation(queryName, queryLine) {
  const nName = normalizeHangul(queryName);
  const nLine = normalizeLine(queryLine);

  if (nLine) {
    const key = `${nLine}@@${nName}`;
    const code = byLineName.get(key);
    if (code) {
      const sample = byCode.get(code);
      const { name, line } = parseStationName(sample.stn_nm);
      return { code, name, line };
    }
  }

  const codes = Array.from(byName.get(nName) || []);
  if (codes.length) {
    const sample = byCode.get(codes[0]);
    const { name, line } = parseStationName(sample.stn_nm);
    return { code: codes[0], name, line };
  }

  return { code: null, name: queryName, line: queryLine || null };
}
