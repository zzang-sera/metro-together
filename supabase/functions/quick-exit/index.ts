// supabase/functions/quick-exit/index.ts
/// <reference lib="deno.ns" />

const SEOUL_API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "getFstExit";

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// ✅ 줄바꿈 포함 모든 태그 추출
function parseTag(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
  return [...xml.matchAll(regex)].map((m) => m[1].trim());
}

async function fetchQuickExit(stationName: string) {
  const normalized = stationName.replace(/\s/g, "");
  const results: any[] = [];

  // 순차적으로 100개씩 조회 (최대 9000까지)
  for (let start = 1; start <= 9000; start += 100) {
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

    // <item>별로 분리
    const itemBlocks = xml.split("<item>").slice(1).map((b) => b.split("</item>")[0]);
    if (itemBlocks.length === 0) break;

    const batch = itemBlocks.map((block) => ({
      qckgffMngNo: parseTag(block, "qckgffMngNo")[0] ?? "",
      lineNm: parseTag(block, "lineNm")[0] ?? "",
      stnCd: parseTag(block, "stnCd")[0] ?? "",
      stnNm: parseTag(block, "stnNm")[0] ?? "",
      stnNo: parseTag(block, "stnNo")[0] ?? "",
      crtrYmd: parseTag(block, "crtrYmd")[0] ?? "",
      upbdnbSe: parseTag(block, "upbdnbSe")[0] ?? "",
      drtnInfo: parseTag(block, "drtnInfo")[0] ?? "",
      qckgffVhclDoorNo: parseTag(block, "qckgffVhclDoorNo")[0] ?? "",
      plfmCmgFac: parseTag(block, "plfmCmgFac")[0] ?? "",
      facNo: parseTag(block, "facNo")[0] ?? "",
      elvtrNo: parseTag(block, "elvtrNo")[0] ?? "",
      fwkPstnNm: parseTag(block, "fwkPstnNm")[0] ?? "",
      facPstnNm: parseTag(block, "facPstnNm")[0] ?? "",
    }));

    results.push(...batch);
  }

  // 역 이름 필터링 (공백 제거 + 유연 비교)
  const filtered = results.filter(
    (e) => (e.stnNm ?? "").replace(/\s/g, "").includes(normalized),
  );

  // 중복 제거 (역코드 + 출입문 번호 기준)
  const unique = Array.from(
    new Map(filtered.map((e) => [`${e.stnCd}-${e.qckgffVhclDoorNo}`, e])).values(),
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

    return new Response(JSON.stringify(data, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ quick-exit error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      { headers: { "Content-Type": "application/json; charset=utf-8" }, status: 500 },
    );
  }
});
