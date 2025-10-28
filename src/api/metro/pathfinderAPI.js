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

    // ✅ 예상되는 응답 형태 예시:
    // {
    //   duration: 4,
    //   distance: "2정거장",
    //   transferCount: 0,
    //   fare: { card: 1550, cash: 1650 },
    //   route: [
    //     { station: "종로3가", line: "1호선", direction: "시청방면" },
    //     { station: "시청", line: "1호선" }
    //   ],
    //   elevators: [
    //     { station: "종로3가", detail: "2-1번 출입구 옆 엘리베이터 → 종각 방면 승강장" },
    //     { station: "시청", detail: "2번 출입구 근처 엘리베이터 → 1호선 종각 방면" }
    //   ]
    // }

    return data;
  } catch (err) {
    console.error("🚨 PathFinder API Error:", err);
    throw err;
  }
}
