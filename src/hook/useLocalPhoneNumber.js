import { useEffect, useState } from "react";
import phoneData from "../assets/metro-data/metro/tel/서울교통공사_역주소 및 전화번호_20250820 (1).json";

export function useLocalPhoneNumber(stationName) {
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stationName) return;

    setLoading(true);
    try {
      let cleanName = stationName.trim();
      if (cleanName === "서울역") cleanName = "서울";

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
