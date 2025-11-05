// src/hook/useSupabaseFacilities.js
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

export function useSupabaseFacilities(stationName, line, type = "EV") {
  const [data, setData] = useState([]);     
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationName || !line) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
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
