import { useEffect, useState } from "react";
import { 
  getEscalatorStatusByName,
  getToiletStatusByName,
  getDisabledToiletStatusByName 
} from "../api/metro/metroAPI";

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
        else {
          // API 미지원 (로컬 데이터만)
          setData([]);
          setLoading(false);
          return;
        }

        // ✅ 공통 필터링
        const filtered = res.filter((r) => {
          if (type === "EV") return r.type?.toUpperCase() === "EV";
          if (type === "ES") return r.type?.toUpperCase() === "ES";
          return true;
        });

        // ✅ 공통 매핑
        const mapped = filtered.map((r, i) => ({
          id: `${r.stationCode || r.STN_CD || stationCode}-${i}`,
          title:
            r.facilityName ||
            (type === "EV"
              ? "엘리베이터"
              : type === "ES"
              ? "에스컬레이터"
              : type === "DT"
              ? "장애인 화장실"
              : "화장실"),
          desc: [r.section, r.position, r.floor, r.dtlPstn]
            .filter(Boolean)
            .join(" "),
          status: r.status || r.whlchrAcsPsbltyYn || "-",
          line: r.lineNm || r.lineName || line,
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
