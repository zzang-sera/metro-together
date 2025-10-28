// src/api/metro/pathFinderAPI.js
import { supabase } from "../../config/supabaseClient";

/**
 * 출발역 → 도착역까지 최단거리/최소환승 경로를 조회
 * @param {string} start 출발역 이름
 * @param {string} end 도착역 이름
 * @param {object} options { wheelchair: boolean }
 */
export async function findAccessiblePath(start, end, options = {}) {
  try {
    const { wheelchair = false } = options;

    // Supabase Edge Function or API endpoint 호출
    const url = `https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/pathfinder?dep=${encodeURIComponent(start)}&arr=${encodeURIComponent(end)}&wheel=${wheelchair}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`경로 탐색 실패 (${response.status})`);

    const data = await response.json();

    return data;
  } catch (err) {
    console.error("🚨 PathFinder API Error:", err);
    throw err;
  }
}
