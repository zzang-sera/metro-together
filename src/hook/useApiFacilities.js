// ✅ src/hook/useApiFacilities.js
import { useEffect, useState } from "react";
import { 
  getEscalatorStatusByName,
  getToiletStatusByName,
  getDisabledToiletStatusByName,
  getWheelchairChargeStatusByName, // 🚀 추가
} from "../api/metro/metroAPI";

/**
 * ✅ 실시간 API 기반 시설 데이터 훅
 * - 기존 EV/ES/TO/DT는 그대로 유지
 * - WC(휠체어 급속충전)만 새로 API 연결
 */
export function useApiFacilities(stationName, stationCode, line, type) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationName) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        let res = [];

        // ✅ 타입별 API 호출
        if (type === "EV" || type === "ES") {
          res = await getEscalatorStatusByName(stationName, stationCode, type);
        } 
        else if (type === "TO") {
          res = await getToiletStatusByName(stationName);
        }
        else if (type === "DT") {
          res = await getDisabledToiletStatusByName(stationName);
        }
        else if (type === "WC") {
          // ✅ 새로 추가된 휠체어 급속충전 API 호출
          res = await getWheelchairChargeStatusByName(stationName);
        }
        else {
          // API 미지원 → 로컬 데이터만
          setData([]);
          setLoading(false);
          return;
        }

        // ✅ 공통 매핑 (WC 구조도 대응)
        const mapped = res.map((r, i) => ({
          id: `${r.stationCode || r.id || stationCode}-${i}`,
          title:
            r.facilityName ||
            (type === "EV"
              ? "엘리베이터"
              : type === "ES"
              ? "에스컬레이터"
              : type === "DT"
              ? "장애인 화장실"
              : type === "WC"
              ? "휠체어 급속 충전기"
              : "화장실"),
          desc:
            r.desc ||
            [r.section, r.position, r.floor, r.dtlPstn]
              .filter(Boolean)
              .join(" ") ||
            "위치 정보 없음",
          status: r.status || "-",
          contact: r.contact || null,
          charge: r.charge || "",
          chargerCount: r.chargerCount || "",
          updated: r.updated || "",
          line: r.line || r.lineName || line,
        }));

        setData(mapped);
      } catch (err) {
        console.error("🚨 실시간 API 오류:", err);
        setError(err.message || "API 오류 발생");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [stationName, stationCode, type]);

  return { data, loading, error };
}
