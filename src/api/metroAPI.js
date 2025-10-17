import { SUPABASE_URL } from "../constants/constants";

// ✅ 역 이름으로 실시간 데이터 요청
export async function getEscalatorStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const url = `${SUPABASE_URL}/functions/v1/metro-escalators?stationName=${encodeURIComponent(stationName)}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("API fetch error:", e);
    throw e;
  }
}
