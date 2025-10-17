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

async function fetchStationData(station: string): Promise<RawRow[]> {
  const encoded = encodeURIComponent(station);
  const url = `${BASE}/${SEOUL_API_KEY}/json/${SERVICE}/1/100/${encoded}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Seoul API HTTP ${res.status}`);
  const json = await res.json();
  const rows = json?.[SERVICE]?.row ?? [];
  return Array.isArray(rows) ? rows : [];
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const stationName = url.searchParams.get("stationName") ?? "";
    const type = url.searchParams.get("type") ?? ""; // EV / ES

    if (!ok(SEOUL_API_KEY)) throw new Error("Missing SEOUL_OPEN_API_KEY");
    if (!ok(stationName)) throw new Error("stationName is required");

    const data = await fetchStationData(stationName);

    let result = data;
    if (type === "EV" || type === "ES") {
      result = result.filter((r) => r.ELVTR_SE === type);
    }

    const mapped = result.map((r) => ({
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
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
