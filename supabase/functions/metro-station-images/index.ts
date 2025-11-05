import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function parseXmlToJson(xml: string) {
  const items = xml.split(/<row>/).slice(1);
  const extract = (text: string, tag: string) => {
    const match = text.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "s"));
    return match ? match[1].trim() : "";
  };

  return items.map((itemText) => ({
    line: extract(itemText, "SBWY_ROUT_LN"),
    station: extract(itemText, "STTN"),
    image: extract(itemText, "IMG_LINK"),
    fileName: extract(itemText, "IMG_NM"),
  }));
}

serve(async (req) => {
  const url = new URL(req.url);
  const stationName = url.searchParams.get("stationName")?.trim() || "";
  const SEOUL_API_KEY = Deno.env.get("SEOUL_API_KEY");

  if (!SEOUL_API_KEY) {
    console.error("❌ Missing SEOUL_API_KEY");
    return new Response("Missing API key", { status: 500 });
  }

  try {
    const apiUrl = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/xml/SmrtEmergerncyGuideImg/1/1000/`;
    const response = await fetch(apiUrl);
    const xml = await response.text();

    if (xml.includes("<CODE>ERROR")) {
      console.error("⚠️ 서울 열린데이터 오류:", xml.slice(0, 100));
      throw new Error("서울 열린데이터 오류: " + xml.slice(0, 200));
    }

    const data = parseXmlToJson(xml);

    const filtered = stationName
      ? data.filter((r) =>
          r.station?.normalize("NFC").includes(stationName.normalize("NFC"))
        )
      : data;

    console.log(`반환된 데이터 수: ${filtered.length}`);

    return new Response(JSON.stringify(filtered), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 200,
    });
  } catch (err) {
    console.error("🚨 metro-station-images error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
