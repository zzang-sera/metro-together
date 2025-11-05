import fs from "fs";
import path from "path";
import url from "url";
import proj4 from "proj4";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const IN_ELEV = path.join(
  ROOT,
  "src",
  "assets",
  "metro-data",
  "metro",
  "elevator",
  "elevator_seoulstation.json"
);
const IN_STATION = path.join(
  ROOT,
  "src",
  "assets",
  "metro-data",
  "metro",
  "station",
  "stationList.json"
);
const OUT_DIR = path.join(ROOT, "src", "assets", "metro-data", "metro", "graph");
const OUT_JSON = path.join(OUT_DIR, "seoul_floor_graph.json");

const EPSG4326 = "+proj=longlat +datum=WGS84 +no_defs";
const EPSG5179 =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";
const EPSG5186 =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs";
const EPSG2097_BESSEL =
  "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-146.43,507.89,681.46";

const norm = (t) =>
  String(t || "")
    .replace(/\(.+?\)/g, "")
    .replace(/\s|역/g, "")
    .toLowerCase();

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function parseWKT(wkt) {
  if (!wkt) return null;
  const m = wkt.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const x = parseFloat(m[1]);
  const y = parseFloat(m[2]);
  if (isNaN(x) || isNaN(y)) return null;

  if (x >= 124 && x <= 132 && y >= 33 && y <= 39) return { lng: x, lat: y };

  const cands = [];
  try {
    const [lng, lat] = proj4(EPSG5179, EPSG4326, [x, y]);
    if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) cands.push({ lat, lng });
  } catch {}
  try {
    const [lng, lat] = proj4(EPSG5186, EPSG4326, [x, y]);
    if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) cands.push({ lat, lng });
  } catch {}
  try {
    const [lng, lat] = proj4(EPSG2097_BESSEL, EPSG4326, [x, y]);
    if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) cands.push({ lat, lng });
  } catch {}

  if (cands.length > 0) return cands[0];
  return null;
}

function dist(a, b) {
  return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
}

function loadStations() {
  const raw = JSON.parse(fs.readFileSync(IN_STATION, "utf8"));
  const list = Array.isArray(raw.Data) ? raw.Data : raw.DATA || [];
  return list
    .map((r) => ({
      name: r.STATN_NM || r.statn_nm || null,
      key: norm(r.STATN_NM || r.statn_nm || ""),
      lat: parseFloat(r.CRDNT_Y || r.lat || r.LAT),
      lng: parseFloat(r.CRDNT_X || r.lng || r.LNG),
    }))
    .filter((s) => s.name && !isNaN(s.lat) && !isNaN(s.lng));
}

function buildFloorGraph(elevJson, stationList) {
  const data = elevJson?.DATA || [];
  const byStation = {};

  data.forEach((row, idx) => {
    const coord = parseWKT(row.node_wkt || row.NODE_WKT);
    if (!coord) return;

    let stationNameRaw = row.sbwy_stn_nm || row.SBWY_STN_NM || null;
    let stationKey = stationNameRaw ? norm(stationNameRaw) : null;

    if (!stationNameRaw && stationList.length) {
      let best = null, bestD = Infinity;
      for (const s of stationList) {
        const d = dist(coord, s);
        if (d < bestD) {
          best = s;
          bestD = d;
        }
      }
      if (bestD < 0.0025) { 
        stationNameRaw = best.name;
        stationKey = best.key;
      }
    }

    const entry = {
      idx,
      station: stationNameRaw || "__UNKNOWN__",
      station_key: stationKey,
      lat: coord.lat,
      lng: coord.lng,
      evId: `EV-${idx}`,
      pairs: [["1F", "B1"]],
    };

    (byStation[stationKey || "__UNKNOWN__"] ||= []).push(entry);
  });

  return byStation;
}

function main() {
  if (!fs.existsSync(IN_ELEV)) {
    console.error(`입력 파일이 없습니다: ${IN_ELEV}`);
    process.exit(1);
  }
  if (!fs.existsSync(IN_STATION)) {
    console.error(`역사 좌표 파일이 없습니다: ${IN_STATION}`);
    process.exit(1);
  }

  const elevRaw = JSON.parse(fs.readFileSync(IN_ELEV, "utf8"));
  const stationList = loadStations();
  const graph = buildFloorGraph(elevRaw, stationList);

  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_JSON, JSON.stringify(graph, null, 2), "utf8");

  console.log(`저장 완료: ${OUT_JSON}`);
  console.log(
    `총 ${Object.keys(graph).length}개 역 / ${
      Object.values(graph).reduce((s, a) => s + a.length, 0)
    }개 엘리베이터 매핑됨`
  );
}

main();
