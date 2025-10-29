//supabase/functions/shortest-route/index.ts
/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getShtrmPath";

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseTag(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, "gs");
  return [...xml.matchAll(regex)].map((m) => m[1]);
}

async function fetchRoute(dep: string, arr: string, dateTime: string) {
  const url = `${BASE}/${SEOUL_API_KEY}/xml/${SERVICE}/1/5/${encodeURIComponent(dep)}/${encodeURIComponent(arr)}/${encodeURIComponent(dateTime)}`;
  const res = await fetch(url);
  const xml = await res.text();

  if (!xml.includes("<document>")) {
    console.error("⚠️ Unexpected response:", xml.slice(0, 300));
    throw new Error("Invalid API response or quota exceeded.");
  }

  const totalTime = Number(parseTag(xml, "totalreqHr")[0] ?? 0);
  const totalDistance = Number(parseTag(xml, "totalDstc")[0] ?? 0);
  const transfers = Number(parseTag(xml, "trsitNmtm")[0] ?? 0);

  const pathBlocks = xml.split("<path>").slice(1).map((b) => b.split("</path>")[0]);
  const paths = pathBlocks.map((block) => {
    const dptreBlock = block.match(/<dptreStn>([\s\S]*?)<\/dptreStn>/)?.[1] ?? "";
    const arvlBlock = block.match(/<arvlStn>([\s\S]*?)<\/arvlStn>/)?.[1] ?? "";
    const fromName = parseTag(dptreBlock, "stnNm")[0] ?? "";
    const toName = parseTag(arvlBlock, "stnNm")[0] ?? "";

    return {
      from: fromName,
      to: toName,
      line: parseTag(block, "lineNm")[0] ?? "",
      time: Number(parseTag(block, "reqHr")[0] ?? 0),
      distance: Number(parseTag(block, "stnSctnDstc")[0] ?? 0),
      transfer: (parseTag(block, "trsitYn")[0] ?? "N") === "Y",
    };
  });

  return { totalTime, totalDistance, transfers, paths };
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const dep = url.searchParams.get("dep") ?? "";
    const arr = url.searchParams.get("arr") ?? "";
    const dateTime =
      url.searchParams.get("dateTime") ??
      new Date().toISOString().slice(0, 19).replace("T", " ");

    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");
    if (!ok(dep) || !ok(arr)) throw new Error("Missing dep or arr");

    const data = await fetchRoute(dep, arr, dateTime);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("shortest-route error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
