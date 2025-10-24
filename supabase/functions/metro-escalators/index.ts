/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "SeoulMetroFaciInfo";

type RawRow = {
  STN_CD?: string | number;
  STN_NM?: string;
  ELVTR_NM?: string;
  OPR_SEC?: string;
  INSTL_PSTN?: string;
  USE_YN?: string;
  ELVTR_SE?: string; // EV / ES
};

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function fetchStationsChunk(start: number, end: number): Promise<RawRow[]> {
  const url = `${BASE}/${SEOUL_API_KEY}/json/${SERVICE}/${start}/${end}`;
  const res = await fetch(url);
  const text = await res.text();

  // 🔎 XML 응답일 경우 오류로 처리
  if (text.trim().startsWith("<")) {
    console.error("⚠️ Received XML (check API key or quota):", text.slice(0, 100));
    throw new Error("Seoul API returned XML (invalid key or request too large)");
  }

  const json = JSON.parse(text);
  const rows = json?.[SERVICE]?.row ?? [];
  return Array.isArray(rows) ? rows : [];
}

// ✅ 전체 데이터 가져오기 (1~2000 범위)
async function fetchAllStations(): Promise<RawRow[]> {
  const chunk1 = await fetchStationsChunk(1, 1000);
  const chunk2 = await fetchStationsChunk(1001, 2000);
  const chunk3 = await fetchStationsChunk(2001, 3000);
  const chunk4 = await fetchStationsChunk(3001, 4000);
  const chunk5 = await fetchStationsChunk(4001, 5000);
  const chunk6 = await fetchStationsChunk(5001, 6000);
  const chunk7 = await fetchStationsChunk(6001, 7000);
  const chunk8 = await fetchStationsChunk(7001, 8000);
  const chunk9 = await fetchStationsChunk(8001, 9000);

  return [...chunk1, ...chunk2, ...chunk3, ...chunk4, ...chunk5, ...chunk6, ...chunk7, ...chunk8, ...chunk9];
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const stationName = url.searchParams.get("stationName") ?? "";
    const type = url.searchParams.get("type") ?? ""; // EV / ES

    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");
    if (!ok(stationName)) throw new Error("stationName is required");

    const allData = await fetchAllStations();

    const target = stationName.replace(/\s/g, "");
    const filtered = allData.filter((r) => {
      const name = (r.STN_NM ?? "").replace(/\s/g, "");

      // 사당, 사당(2), 사당(4)
      if (name === target || name.startsWith(target + "(")) return true;

      // 동대문 vs 동대문역사문화공원 구분
      if (name === target) return true;
      return false;
    });

    const typed = type ? filtered.filter((r) => r.ELVTR_SE === type) : filtered;

    const mapped = typed.map((r) => ({
      stationCode: r.STN_CD ?? "",
      stationName: r.STN_NM ?? "",
      facilityName: r.ELVTR_NM ?? "",
      section: r.OPR_SEC ?? "",
      position: r.INSTL_PSTN ?? "",
      status: r.USE_YN ?? "",
      type: r.ELVTR_SE ?? "",
    }));

    return new Response(JSON.stringify(mapped), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
