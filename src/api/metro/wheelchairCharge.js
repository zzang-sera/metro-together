// src/api/wheelchairCharge.js
export async function getWheelchairChargeList(stationName) {
  try {
    const res = await fetch(
      `https://utqfwkhxacqhgjjalpby.functions.supabase.co/wheelchair-charge?stationName=${encodeURIComponent(stationName)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error("⚠️ getWheelchairChargeList error:", e);
    return [];
  }
}
