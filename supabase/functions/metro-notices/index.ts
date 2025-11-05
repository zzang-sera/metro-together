/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getNtceList";

type RawItem = {
  noftTtl?: string;
  noftCn?: string;
  noftOcrnDt?: string;
  lineNmLst?: string;
  stnSctnCdLst?: string;
  crtrYmd?: string;
  noftSeCd?: string;
  nonstopYn?: string;
  upbdnbSe?: string;
  xcseSitnBgngDt?: string;
  xcseSitnEndDt?: string;
};

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function extract(tag: string, xml: string): string {
  const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "s");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function parseXml(xmlText: string): RawItem[] {
  const items: RawItem[] = [];
  const itemBlocks = xmlText.split(/<item>/g).slice(1);

  for (const block of itemBlocks) {
    const itemXml = block.split("</item>")[0];
    items.push({
      noftTtl: extract("noftTtl", itemXml),
      noftCn: extract("noftCn", itemXml),
      noftOcrnDt: extract("noftOcrnDt", itemXml),
      lineNmLst: extract("lineNmLst", itemXml),
      stnSctnCdLst: extract("stnSctnCdLst", itemXml),
      crtrYmd: extract("crtrYmd", itemXml),
      noftSeCd: extract("noftSeCd", itemXml),
      nonstopYn: extract("nonstopYn", itemXml),
      upbdnbSe: extract("upbdnbSe", itemXml),
      xcseSitnBgngDt: extract("xcseSitnBgngDt", itemXml),
      xcseSitnEndDt: extract("xcseSitnEndDt", itemXml),
    });
  }

  return items;
}

async function fetchNoticesChunk(start: number, end: number): Promise<RawItem[]> {
  const url = `${BASE}/${SEOUL_API_KEY}/xml/${SERVICE}/${start}/${end}/`;
  const res = await fetch(url);
  const text = await res.text();

  if (!text.trim().startsWith("<")) {
    console.error("⚠️ Unexpected response:", text.slice(0, 100));
    return [];
  }

  return parseXml(text);
}

async function fetchAllNotices(): Promise<RawItem[]> {
  const chunks: RawItem[] = [];
  const pageSize = 500; 

  for (let start = 1; start <= 2000; start += pageSize) {
    const end = start + pageSize - 1;
    const part = await fetchNoticesChunk(start, end);
    if (part.length === 0) break;
    chunks.push(...part);
  }

  return chunks;
}

Deno.serve(async (req) => {
  try {
    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const useLimit = limitParam && /^\d+$/.test(limitParam);
    const limit = useLimit ? Number(limitParam) : null;

    const items = await fetchAllNotices();

    const mapped = items.map((r) => ({
      title: r.noftTtl ?? "",
      content: (r.noftCn ?? "").replace(/\s+/g, " ").trim(),
      occurred: r.noftOcrnDt ?? "",
      line: r.lineNmLst ?? "",
      nonstop: r.nonstopYn === "Y" ? "무정차 통과" : "정상 운행",
      direction: r.upbdnbSe || "",
      category: r.noftSeCd || "",
    }));

    const sliced = limit ? mapped.slice(0, limit) : mapped;

    return new Response(JSON.stringify(sliced), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(" metro-notices error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
