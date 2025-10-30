//supabase/functions/wheelchair-charge/index.ts
/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getWksnWhclCharge";

type RawRow = {
  fcltNm?: string;
  lineNm?: string;
  stnCd?: string | number;
  stnNm?: string;
  stnNo?: string;
  cnnctrSe?: string;
  stnFlr?: string;
  elctcFacCnt?: string;
  dtlPstn?: string;
  crtrYmd?: string;
  grndUdgdSe?: string;
  utztnCrg?: string;
  operInstTelno?: string;
};

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// ✅ XML 문자열을 간단하게 JSON 객체로 변환하는 함수
function parseXML(xmlText: string): RawRow[] {
  const items: RawRow[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const getValue = (tag: string) => {
      const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
      const found = re.exec(itemXml);
      return found ? found[1].trim() : "";
    };

    items.push({
      fcltNm: getValue("fcltNm"),
      lineNm: getValue("lineNm"),
      stnCd: getValue("stnCd"),
      stnNm: getValue("stnNm"),
      stnNo: getValue("stnNo"),
      cnnctrSe: getValue("cnnctrSe"),
      stnFlr: getValue("stnFlr"),
      elctcFacCnt: getValue("elctcFacCnt"),
      dtlPstn: getValue("dtlPstn"),
      crtrYmd: getValue("crtrYmd"),
      grndUdgdSe: getValue("grndUdgdSe"),
      utztnCrg: getValue("utztnCrg"),
      operInstTelno: getValue("operInstTelno"),
    });
  }

  return items;
}

// ✅ 1000개 단위로 API 데이터 가져오기
async function fetchWheelchairChunk(start: number, end: number): Promise<RawRow[]> {
  const url = `${BASE}/${SEOUL_API_KEY}/xml/${SERVICE}/${start}/${end}`;
  const res = await fetch(url);
  const text = await res.text();

  if (text.trim().startsWith("<") === false) {
    console.error("⚠️ Invalid response (not XML):", text.slice(0, 100));
    throw new Error("Unexpected non-XML response from Seoul API");
  }

  return parseXML(text);
}

// ✅ 전체 데이터 (1~2000 범위)
async function fetchAllWheelchairs(): Promise<RawRow[]> {
  const chunk1 = await fetchWheelchairChunk(1, 1000);
  const chunk2 = await fetchWheelchairChunk(1001, 2000);
  return [...chunk1, ...chunk2];
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const stationName = url.searchParams.get("stationName") ?? "";

    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");
    if (!ok(stationName)) throw new Error("stationName is required");

    const allData = await fetchAllWheelchairs();

    const target = stationName.replace(/\s/g, "");
    const filtered = allData.filter((r) => {
      const name = (r.stnNm ?? "").replace(/\s/g, "");
      if (name === target || name.startsWith(target + "(")) return true;
      return false;
    });

    const mapped = filtered.map((r) => ({
      facilityName: r.fcltNm ?? "",
      lineName: r.lineNm ?? "",
      stationCode: r.stnCd ?? "",
      stationName: r.stnNm ?? "",
      stationNo: r.stnNo ?? "",
      connectorType: r.cnnctrSe ?? "",
      floor: r.stnFlr ?? "",
      chargerCount: r.elctcFacCnt ?? "",
      position: r.dtlPstn ?? "",
      updated: r.crtrYmd ?? "",
      groundType: r.grndUdgdSe ?? "",
      charge: r.utztnCrg ?? "",
      contact: r.operInstTelno ?? "",
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
