// scripts/convertSubwayData.js
const fs = require("fs");
const path = require("path");
const proj4 = require("proj4");

// TM(5179) → WGS84(4326) 정의
proj4.defs(
  "EPSG:5179",
  "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs"
);

// ✅ 네 파일 경로
const SRC = path.resolve(__dirname, "../src/assets/metro-data/metro/entrance/tnSubwayEntrc.json");
// ✅ 결과 저장 경로
const OUT = path.resolve(__dirname, "../src/assets/metro-data/graph/subway_graph.json");

// TM → WGS84
const convert = (x, y) => {
  const [lon, lat] = proj4("EPSG:5179", "EPSG:4326", [x, y]);
  return { lat, lon };
};

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`❌ 원본 파일 없음: ${SRC}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const nodes = [];
  const byStation = new Map();

  for (const item of raw) {
    const stationId = item["지하철역ID"];
    const exitNo = item["출입구번호"];
    const x = item["지하철역X좌표"];
    const y = item["지하철역Y좌표"];
    if (!stationId || !exitNo || !x || !y) continue;

    const { lat, lon } = convert(Number(x), Number(y));
    const id = `${stationId}_${exitNo}`;

    nodes.push({
      id,
      name: `${stationId} 출입구${exitNo}`,
      station_id: stationId,
      exit_no: exitNo,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      distance_to_bus: item["출구와정류장간이동거리"] ?? null,
      nearby: item["주변건물"] ?? "",
    });

    if (!byStation.has(stationId)) byStation.set(stationId, []);
    byStation.get(stationId).push({ stationId, exitNo });
  }

  // 같은 역 출입구끼리 연결 (임시 평균 거리)
  const edges = [];
  for (const [stationId, exits] of byStation.entries()) {
    for (let i = 0; i < exits.length; i++) {
      for (let j = i + 1; j < exits.length; j++) {
        const a = exits[i];
        const b = exits[j];
        const fromId = `${a.stationId}_${a.exitNo}`;
        const toId = `${b.stationId}_${b.exitNo}`;
        edges.push({ from: fromId, to: toId, weight: 100 });
      }
    }
  }

  const graph = { crs: "EPSG:4326", nodes, edges };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(graph, null, 2), "utf8");

  console.log(`✅ subway_graph.json 생성 완료 (${nodes.length} nodes, ${edges.length} edges)`);
}

main();
