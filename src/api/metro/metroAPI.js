import { SUPABASE_URL } from "../../constants/constants";

/**
 * ✅ 승강기/에스컬레이터 정보
 */
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

/**
 * ✅ 화장실 정보 (일반)
 * - 서울 열린데이터 '편의시설위치정보 화장실 현황' 기반
 * - Supabase Edge Function: /metro-toilets
 */
export async function getToiletStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({
    stationName,
  });

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

/**
 * ✅ 장애인 화장실 정보
 * - 서울 열린데이터 '교통약자이용정보 장애인화장실 현황' 기반
 * - Supabase Edge Function: /metro-toilets-disabled
 */
export async function getDisabledToiletStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({
    stationName,
  });

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
