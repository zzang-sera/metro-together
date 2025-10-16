// src/api/metroAPI.js
import { SUPABASE_URL } from "../constants/constants";

export async function getEscalatorStatus() {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/metro-escalators`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("API fetch error:", e);
    throw e;
  }
}
