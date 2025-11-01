import { useEffect, useState } from "react";
import phoneData from "../assets/metro-data/metro/tel/서울교통공사_역주소 및 전화번호_20250820 (1).json";

/**
 * ✅ 로컬 JSON에서 역명으로 전화번호 검색하는 훅
 * - JSON 구조 예시: [{ "역명": "서울", "역전화번호": "02-6110-1331" }, ...]
 * - “서울역” → “서울”로 정규화하여 검색
 */
export function useLocalPhoneNumber(stationName) {
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stationName) return;

    setLoading(true);
    try {
      // 역명 정규화
      let cleanName = stationName.trim();
      if (cleanName === "서울역") cleanName = "서울";

      // JSON에서 해당 역 찾기
      const found = phoneData.find((item) => item.역명 === cleanName);

      if (found && found.역전화번호) {
        setPhone(found.역전화번호);
      } else {
        setPhone(null);
      }
    } catch (err) {
      console.error("🚨 전화번호 로드 오류:", err);
      setPhone(null);
    } finally {
      setLoading(false);
    }
  }, [stationName]);

  return { phone, loading };
}
