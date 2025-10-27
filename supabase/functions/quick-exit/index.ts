/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getFstExit";

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseTag(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, "gs");
  return [...xml.matchAll(regex)].map((m) => m[1]);
}

async function fetchQuickExit(stationName: string) {
  const normalized = stationName.replace(/\s/g, "");
  const results: any[] = [];

  // 페이지별로 순차 조회 (서울시 API는 최대 1000건 페이지네이션)
  for (let start = 1; start <= 2300; start += 100) {
    const end = start + 99;
    const url = `${BASE}/${SEOUL_API_KEY}/xml/${SERVICE}/${start}/${end}/${encodeURIComponent(
      stationName,
    )}`;

    const res = await fetch(url);
    const xml = await res.text();

    if (!xml.includes("<response>")) {
      console.warn("⚠️ Invalid API response:", xml.slice(0, 200));
      break;
    }

    const itemBlocks = xml.split("<item>").slice(1).map((b) => b.split("</item>")[0]);
    if (itemBlocks.length === 0) break;

    const batch = itemBlocks.map((block) => ({
      stationName: parseTag(block, "stnNm")[0] ?? "",
      line: parseTag(block, "lineNm")[0] ?? "",
      stationCode: parseTag(block, "stnCd")[0] ?? "",
      doorNumber: parseTag(block, "qckgffVhclDoorNo")[0] ?? "",
      facility: parseTag(block, "plfmCmgFac")[0] ?? "",
      direction: parseTag(block, "drtnInfo")[0] ?? "", // 구조 유지
      position: parseTag(block, "facPstnNm")[0] ?? "",
      elevatorNo: parseTag(block, "elvtrNo")[0] ?? "",
    }));

    results.push(...batch);
  }

  // 🚦 역 이름으로 필터링
  const filtered = results.filter(
    (e) => (e.stationName ?? "").replace(/\s/g, "") === normalized,
  );

  // 🔁 중복 제거 (stationCode + doorNumber)
  const unique = Array.from(
    new Map(filtered.map((e) => [`${e.stationCode}-${e.doorNumber}`, e])).values(),
  );

  return unique;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const stationName = url.searchParams.get("stationName") ?? "";

    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");
    if (!ok(stationName)) throw new Error("stationName is required");

    const data = await fetchQuickExit(stationName);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ quick-exit error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
