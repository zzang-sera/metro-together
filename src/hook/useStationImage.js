import { useState, useEffect } from "react";
import { getStationImageByName } from "../api/metro/metroAPI";

export function useStationImage(stationName) {
  const [data, setData] = useState(null);      
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);     

  useEffect(() => {
    if (!stationName) return;

    async function fetchImage() {
      setLoading(true);
      setError(null);

      try {
        const res = await getStationImageByName(stationName);

        if (Array.isArray(res) && res.length > 0) {
          setData(res[0]); 
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("🚨 useStationImage error:", err);
        setError(err.message || "이미지 불러오기 오류");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [stationName]);

  return { data, loading, error };
}
