/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getWksnRstrm";

interface DisabledToiletRow {
  facilityId: string;
  facilityName: string;
  lineName: string;
  stationCode: string;
  stationName: string;
  stationNo: string;
  position: string;
  floor: string;
  access: string;
  gender: string;
  groundType: string;
  inout: string;
}

function parseXmlToJson(xml: string): DisabledToiletRow[] {
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
    gender: extract(itemText, "rstrmSe"),
    groundType: extract(itemText, "grndUdgdSe"),
    inout: extract(itemText, "gateInoutSe"),
  }));
}

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function fetchChunk(start: number, end: number): Promise<DisabledToiletRow[]> {
  const url = `${BASE}/${SEOUL_API_KEY}/xml/${SERVICE}/${start}/${end}/`;
  const res = await fetch(url);
  const xml = await res.text();

  if (xml.trim().startsWith("<!DOCTYPE") || xml.includes("<html")) {
    throw new Error("Invalid XML response — check API key or rate limit");
  }

  return parseXmlToJson(xml);
}

async function fetchAllToilets(): Promise<DisabledToiletRow[]> {
  const chunkSize = 200;
  const total = 2000;
  const promises: Promise<DisabledToiletRow[]>[] = [];

  for (let start = 1; start <= total; start += chunkSize) {
    const end = start + chunkSize - 1;
    promises.push(fetchChunk(start, end));
  }

  const results = await Promise.all(promises);
  return results.flat();
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
        const matchStation = name === target || name.startsWith(target + "(");

        const isAccessible =
          (r.facilityName || "").includes("교통약자") ||
          (r.access && r.access.toUpperCase() === "Y");

        return matchStation && isAccessible;
      });
    }

    return new Response(JSON.stringify(filtered), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("🚨 Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
