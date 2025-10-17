/// <reference lib="deno.ns" />

// Deno 환경 호환되는 경량 XML 파서
import { parse } from "https://deno.land/x/xml@2.1.0/mod.ts";

Deno.serve(async (_req: Request) => {
  try {
    const API_KEY = Deno.env.get("SEOUL_OPEN_API_KEY");
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Missing SEOUL_OPEN_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 서울교통공사_교통약자_이용시설_승강기_가동현황 (XML)
    const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/SeoulMetroFaciInfo/1/100/`;
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Open API HTTP ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const xmlText = await res.text();
    const xmlObj: any = parse(xmlText);
    const rows = xmlObj?.SeoulMetroFaciInfo?.row ?? [];

    const data = rows.map((item: Record<string, string>) => ({
      stationCode: Number(item.STN_CD),
      stationName: item.STN_NM,
      elevatorName: item.ELVTR_NM,
      section: item.OPR_SEC,
      position: item.INSTL_PSTN,
      status: item.USE_YN,
      type: item.ELVTR_SE,
    }));

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
