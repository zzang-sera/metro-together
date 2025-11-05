import { supabase } from "../../config/supabaseClient";

/**

 * @param {string} start 
 * @param {string} end 
 * @param {object} options 
 */
export async function findAccessiblePath(start, end, options = {}) {
  try {
    const { wheelchair = false } = options;

    const url = `https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/pathfinder?dep=${encodeURIComponent(start)}&arr=${encodeURIComponent(end)}&wheel=${wheelchair}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`경로 탐색 실패 (${response.status})`);

    const data = await response.json();

    return data;
  } catch (err) {
    console.error(" PathFinder API Error:", err);
    throw err;
  }
}
