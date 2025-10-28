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

interface Facility {
  stationCode: string;
  stationName: string;
  facilityName: string;
  section: string;
  position: string;
  status: string;
  type: string; // EV or ES
}

// ✅ 안전한 fetch
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

// ✅ TalkBack-friendly 문장 정리 + 줄바꿈 처리
function normalizeForTalkBack(text: string): string {
  if (!text) return "";
  let t = text.replace(/\s+/g, " ").trim();
  if (!t.endsWith(".") && !t.endsWith("!")) t += ".";
  t = t.replace(/(\s*\.){2,}/g, ".");
  if (t.includes("⚠️")) t = t.replace("⚠️", "⚠️ 주의. ");
  // ✅ 마침표 뒤 줄바꿈 추가
  t = t.replace(/\. /g, ".\n");
  return t;
}

// ✅ 출입구 보수 안내
function getClosedExitNotice(facilities: Facility[] = [], stationName: string): string | null {
  const closed = facilities.filter(
    (f) =>
      f.type === "EV" &&
      f.position.includes("출입구") &&
      (f.status.includes("보수") || f.status.includes("점검"))
  );
  if (closed.length > 0) {
    const exits = closed
      .map((f) => f.position.match(/\d+번 출입구/)?.[0] ?? "출입구")
      .join(", ");
    return `⚠️ ${stationName} ${exits} 엘리베이터가 보수 중입니다. 다른 출입구 엘리베이터를 이용하세요.`;
  }
  return null;
}

// ✅ 가장 가까운 시설 찾기
function findNearestFacility(facilities: Facility[] = [], preferElevator: boolean): Facility | null {
  if (!facilities || facilities.length === 0) return null;
  const available = facilities.filter(
    (f) => f.status && !f.status.includes("보수") && !f.status.includes("점검")
  );
  if (available.length === 0) return null;

  if (preferElevator) {
    const elevators = available.filter((f) => f.type === "EV");
    return elevators.length > 0 ? elevators[0] : available[0];
  }
  return available[0];
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const dep = url.searchParams.get("dep") ?? "";
    const arr = url.searchParams.get("arr") ?? "";
    const dateTime = url.searchParams.get("dateTime") ??
      new Date().toISOString().slice(0, 19).replace("T", " ");
    const wheelchair = url.searchParams.get("wheelchair") === "true";

    if (!ok(dep) || !ok(arr)) {
      return new Response(
        JSON.stringify({ error: "Missing dep or arr parameters" }),
        { headers: { "Content-Type": "application/json" }, status: 400 },
      );
    }

    // ✅ 병렬 호출
    const [routeData, depFacilitiesRaw, arrFacilitiesRaw] = await Promise.all([
      safeFetch<RouteData>(
        `${SUPABASE_URL}/functions/v1/shortest-route?dep=${encodeURIComponent(dep)}&arr=${encodeURIComponent(arr)}&dateTime=${encodeURIComponent(dateTime)}`
      ),
      safeFetch<Facility[]>(
        `${SUPABASE_URL}/functions/v1/metro-escalators?stationName=${encodeURIComponent(dep)}`
      ),
      safeFetch<Facility[]>(
        `${SUPABASE_URL}/functions/v1/metro-escalators?stationName=${encodeURIComponent(arr)}`
      ),
    ]);

    const depFacilities = depFacilitiesRaw ?? [];
    const arrFacilities = arrFacilitiesRaw ?? [];

    if (!routeData || !Array.isArray(routeData.paths)) {
      throw new Error("Invalid route data");
    }

    let totalTime = routeData.totalTime ?? 0;
    if (wheelchair) totalTime = Math.round(totalTime * 1.2);

    const paths = routeData.paths ?? [];
    const firstLine = paths[0]?.line ?? "";
    const lastLine = paths[paths.length - 1]?.line ?? "";
    const transfers = routeData.transfers ?? 0;

    // ✅ 환승 정보 (문장 구조 + 줄바꿈 적용)
    const transferInfo: {
      index: number;
      station: string;
      fromLine: string;
      toLine: string;
      transferDoor: string;
      direction: { from: string; to: string };
      text: string;
      displayLines: string[];
    }[] = [];

    for (let i = 0; i < paths.length - 1; i++) {
      if (paths[i].transfer) {
        const current = paths[i];
        const next = paths[i + 1];
        const fromLine = current.line;
        const toLine = next?.line ?? "";
        const toDirection = `${toLine} ${next?.to ?? "다음 역"} 방면`;

        const stationLabel = `${current.to} (${fromLine} → ${toLine})`;
        const detailText = `${toDirection}으로 환승하세요.`;

        transferInfo.push({
          index: transferInfo.length + 1,
          station: stationLabel,
          fromLine,
          toLine,
          transferDoor: `${(transferInfo.length + 1) * 2}-1`,
          direction: { from: `${fromLine} ${current.to} 방면`, to: toDirection },
          text: normalizeForTalkBack(detailText),
          displayLines: [detailText],
        });
      }
    }

    // ✅ 출발역 안내
    const depFacility = findNearestFacility(depFacilities, wheelchair);
    const depClosedNotice = getClosedExitNotice(depFacilities, dep);
    const firstTransfer = transferInfo?.[0];
    const depDirection = firstTransfer
      ? firstTransfer.direction?.from?.split(" ")[1] ?? ""
      : paths[0]?.to ?? "";
    const depDoor = firstTransfer?.transferDoor ?? "2-1";

    const depLine1 = `${
      depFacility
        ? `${depFacility.position} 위치의 ${depFacility.type === "EV" ? "엘리베이터" : "에스컬레이터"}를 이용해 탑승장으로 이동하세요.`
        : "이용 가능한 승강기 정보가 없습니다."
    }`;
    const depLine2 = `${depDirection} 방면 ${depDoor}칸에 탑승하세요.`;
    const depText = normalizeForTalkBack(`${depLine1} ${depLine2} ${depClosedNotice ?? ""}`);

    // ✅ 도착역 안내
    const arrFacility = findNearestFacility(arrFacilities, wheelchair);
    const arrClosedNotice = getClosedExitNotice(arrFacilities, arr);
    const arrLine = `${
      arrFacility
        ? `${arrFacility.position} 위치의 ${arrFacility.type === "EV" ? "엘리베이터" : "에스컬레이터"}를 이용하세요.`
        : "이용 가능한 승강기 정보가 없습니다."
    } ${arrClosedNotice ?? ""}`;
    const arrText = normalizeForTalkBack(arrLine);

    // ✅ 휠체어 상태
    let wheelchairStatus = "OK";
    const allFacilities = [...depFacilities, ...arrFacilities];
    const brokenElevators = allFacilities.filter(
      (f) => f.type === "EV" && (f.status.includes("보수") || f.status.includes("점검"))
    );
    if (wheelchair && brokenElevators.length > 0) {
      const allElevators = allFacilities.filter((f) => f.type === "EV");
      wheelchairStatus =
        brokenElevators.length === allElevators.length ? "UNAVAILABLE" : "PARTIAL";
    }

    // ✅ 최종 응답
    const responseData = {
      totalTime,
      totalDistance: routeData.totalDistance ?? 0,
      transfers,
      routeSummary: {
        departure: `${dep}역 (${firstLine})`,
        arrival: `${arr}역 (${lastLine})`,
        transfers,
        estimatedTime: `${Math.round(totalTime / 60)}분 (+5분 포함)`,
      },
      transferInfo,
      stationFacilities: {
        departure: {
          station: dep,
          text: depText,
          displayLines: depText.split("\n").filter(Boolean),
        },
        arrival: {
          station: arr,
          text: arrText,
          displayLines: arrText.split("\n").filter(Boolean),
        },
      },
      wheelchairStatus,
      meta: { wheelchairMode: wheelchair, dateTime },
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 200,
    });
  } catch (err) {
    console.error("🧩 pathfinder error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
        status: 500,
      },
    );
  }
});
