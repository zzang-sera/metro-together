// src/hook/useSupabaseFacilities.js
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

/**
 * Supabase에서 엘리베이터 위치/거리 정보를 불러온다.
 * 기대 스키마 (테이블명: elevators 예시):
 * id: bigint, station: text, line: text, exit: text, distance: numeric(선택),
 * lat: float8, lng: float8
 */
export function useSupabaseFacilities(stationName, line, type = "EV") {
  const [data, setData] = useState([]);     // [{ id, station, line, exit, distance?, lat, lng }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationName || !line) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 필요시 테이블명 변경 가능
        const { data: rows, error: err } = await supabase
          .from("elevators")
          .select("id, station, line, exit, distance, lat, lng")
          .eq("station", stationName)
          .eq("line", line);

        if (err) throw err;
        if (!cancelled) setData(rows || []);
      } catch (e) {
        console.error("❌ Supabase Error:", e.message);
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [stationName, line, type]);

  return { data, loading, error };
}
