// ✅ src/api/metro/metroAPI.js
import { SUPABASE_URL } from "../../constants/constants";
import localStationImages from "../../assets/metro-data/metro/station/station_images.json";

export async function getEscalatorStatusByName(stationName, stationCode, type) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({
    stationName,
    stationCode: stationCode || "",
    type: type || "",
  });

  const url = `${SUPABASE_URL}/functions/v1/metro-escalators?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("🚨 getEscalatorStatusByName error:", e);
    throw e;
  }
}

export async function getToiletStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({ stationName });
  const url = `${SUPABASE_URL}/functions/v1/metro-toilets?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("🚨 getToiletStatusByName error:", e);
    throw e;
  }
}

export async function getDisabledToiletStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({ stationName });
  const url = `${SUPABASE_URL}/functions/v1/metro-toilets-disabled?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("🚨 getDisabledToiletStatusByName error:", e);
    throw e;
  }
}

export async function getStationImageByName(stationName) {
  try {
    if (!stationName) return [];

    const baseName = String(stationName).replace(/역$/u, "");
    const found = localStationImages?.DATA?.find(
      (it) => String(it.sttn).replace(/역$/u, "") === baseName
    );

    if (!found) {
      console.warn(`⚠️ ${stationName}의 도면 이미지가 station_images.json에 없습니다.`);
      return [];
    }

    return [
      {
        line: String(found.sbwy_rout_ln),
        station: String(found.sttn),
        image: { uri: String(found.img_link) },
        fileName: String(found.img_nm),
      },
    ];
  } catch (e) {
    console.error("🚨 getStationImageByName error:", e);
    return [];
  }
}

/**
 * ✅ 휠체어 급속충전 정보
 * - Supabase Edge Function: /wheelchair-charge
 * - 서울 열린데이터 기반
 */
export async function getWheelchairChargeStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({ stationName });
  const url = `${SUPABASE_URL}/functions/v1/wheelchair-charge?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    return json.map((r, i) => ({
      id: `${r.stationCode || stationName}-${i}`,
      facilityName: r.facilityName || "휠체어 급속 충전기",
      desc: `${r.floor || ""} ${r.position || ""}`.trim() || "위치 정보 없음",
      contact: r.contact || null,
      updated: r.updated || null,
      chargerCount: r.chargerCount || "",
      charge: r.charge || "",
      line: r.lineName || "",
    }));
  } catch (e) {
    console.error("🚨 getWheelchairChargeStatusByName error:", e);
    return [];
  }
}
