import { useState, useEffect } from "react";
import { getStationImageByName } from "../api/metro/metroAPI";

/**
 * ✅ useStationImage Hook
 * - 입력된 stationName(예: "서울역")을 기반으로
 *   Supabase Edge Function (/metro-station-images) 호출
 * - 비상대피도 이미지(JPG/GIF) 데이터를 가져옴
 * - { data, loading, error } 형태로 반환
 */
export function useStationImage(stationName) {
  const [data, setData] = useState(null);      // 이미지 데이터
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null);     // 에러 메시지

  useEffect(() => {
    if (!stationName) return;

    async function fetchImage() {
      setLoading(true);
      setError(null);

      try {
        const res = await getStationImageByName(stationName);

        // ✅ 응답 데이터가 배열 형태일 경우, 여러 노선 이미지 중 첫 번째를 사용
        if (Array.isArray(res) && res.length > 0) {
          setData(res[0]); // 예: { line: "1", station: "서울역", image: "https://..." }
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
