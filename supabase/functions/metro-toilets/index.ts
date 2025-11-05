/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getFcRstrm";

interface ToiletRow {
  facilityId: string;
  facilityName: string;
  lineName: string;
  stationCode: string;
  stationName: string;
  stationNo: string;
  position: string;
  floor: string;
  access: string;
  restInfo: string;
  groundType: string;
  inout: string;
}

function parseXmlToJson(xml: string): ToiletRow[] {
  const items = xml.split(/<item>/).slice(1);
  const extract = (text: string, tag: string) => {
    const match = text.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "s"));
    return match ? match[1].trim() : "";
  };

  return items.map((itemText) => ({
    facilityId: extract(itemText, "fcltNo"),
    facilityName: extract(itemText, "fcltNm"),
    lineName: extract(itemText, "lineNm"),
    stationCode: extract(itemText, "stnCd"),
    stationName: extract(itemText, "stnNm"),
    stationNo: extract(itemText, "stnNo"),
    position: extract(itemText, "dtlPstn"),
    floor: extract(itemText, "stnFlr"),
    access: extract(itemText, "whlchrAcsPsbltyYn"),
    restInfo: extract(itemText, "rstrmInfo"),
    groundType: extract(itemText, "grndUdgdSe"),
    inout: extract(itemText, "gateInoutSe"),
  }));
}

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function fetchChunk(start: number, end: number): Promise<ToiletRow[]> {
  const url = `${BASE}/${SEOUL_API_KEY}/xml/${SERVICE}/${start}/${end}/`;
  const res = await fetch(url);
  const xml = await res.text();

  if (xml.trim().startsWith("<!DOCTYPE") || xml.includes("<html")) {
    throw new Error("Invalid XML response — check API key or rate limit");
  }

  return parseXmlToJson(xml);
}

async function fetchAllToilets(): Promise<ToiletRow[]> {
  const chunks = await Promise.all([
    fetchChunk(1, 200),
    fetchChunk(201, 400),
    fetchChunk(401, 600),
    fetchChunk(601, 800),
    fetchChunk(801, 1000),
    fetchChunk(1001, 1200),
    fetchChunk(1201, 1400),
    fetchChunk(1401, 1600),
    fetchChunk(1601, 1800),
    fetchChunk(1801, 2000),
  ]);
  return chunks.flat();
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const stationName = url.searchParams.get("stationName") ?? "";

    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");

    const allData = await fetchAllToilets();

    let filtered = allData;
    if (ok(stationName)) {
      const target = stationName.replace(/\s/g, "");
      filtered = allData.filter((r) => {
        const name = (r.stationName ?? "").replace(/\s/g, "");
        return name === target || name.startsWith(target + "(");
      });
    }

    return new Response(JSON.stringify(filtered), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(" Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
