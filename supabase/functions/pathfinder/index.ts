/// <reference lib="deno.ns" />

const SUPABASE_URL = "https://utqfwkhxacqhgjjalpby.supabase.co";

function ok(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

interface RouteData {
  totalTime?: number;
  totalDistance?: number;
  transfers?: number;
  paths?: {
    from: string;
    to: string;
    line: string;
    time: number;
    distance: number;
    transfer: boolean;
  }[];
}

interface QuickExit {
  stationName: string;
  line: string;
  stationCode: string;
  doorNumber: string;
  facility?: string;
  direction?: string;
  position?: string;
  elevatorNo?: string;
}

interface Facility {
  stationCode: string;
  stationName: string;
  facilityName: string;
  section: string;
  position: string;
  status: string;
  type: string;
}

// ✅ 공용 fetch 함수 (에러 캐치 포함)
async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (!text || text.trim() === "") throw new Error("Empty response");
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("❌ Fetch error:", url, err);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const dep = url.searchParams.get("dep") ?? "";
    const arr = url.searchParams.get("arr") ?? "";
    const wheelchair = url.searchParams.get("wheelchair") === "true";

    if (!ok(dep) || !ok(arr)) {
      return new Response(
        JSON.stringify({ error: "Missing dep or arr parameters" }),
        { headers: { "Content-Type": "application/json" }, status: 400 },
      );
    }

    // ✅ 병렬 호출
    const [routeData, exitData, facilityData] = await Promise.all([
      safeFetch<RouteData>(
        `${SUPABASE_URL}/functions/v1/shortest-route?dep=${encodeURIComponent(dep)}&arr=${encodeURIComponent(arr)}`
      ),
      safeFetch<QuickExit[]>(
        `${SUPABASE_URL}/functions/v1/quick-exit?stationName=${encodeURIComponent(arr)}`
      ),
      safeFetch<Facility[]>(
        `${SUPABASE_URL}/functions/v1/metro-escalators?stationName=${encodeURIComponent(arr)}`
      ),
    ]);

    if (!routeData || !Array.isArray(routeData.paths)) {
      throw new Error("Invalid route data");
    }

    // ✅ 중복 제거
    const uniqueExit = Array.from(
      new Map(
        (exitData ?? []).map((e) => [`${e.stationCode}-${e.doorNumber}`, e])
      ).values(),
    );

    // ✅ 휠체어 상태 판단
    let wheelchairStatus = "OK";
    if (wheelchair && Array.isArray(facilityData)) {
      const elevators = facilityData.filter((f) => f.type === "EV");
      const broken = elevators.filter(
        (el) => el.status.includes("보수") || el.status.includes("점검"),
      );
      if (elevators.length > 0 && broken.length === elevators.length) {
        wheelchairStatus = "UNAVAILABLE";
      } else if (broken.length > 0) {
        wheelchairStatus = "PARTIAL";
      }
    }

    // ✅ 응답 구성
    const responseData = {
      totalTime: routeData.totalTime ?? 0,
      totalDistance: routeData.totalDistance ?? 0,
      transfers: routeData.transfers ?? 0,
      paths: routeData.paths ?? [],
      arrivalInfo: {
        quickExit: uniqueExit,
        facilities: facilityData ?? [],
      },
      wheelchairStatus,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    console.error("🧩 pathfinder error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
