// src/hook/useApiFacilities.js

import { useEffect, useState } from "react";
import { getEscalatorStatusByName } from "../api/metro/metroAPI";

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
        // ✅ 함수명 수정
        const res = await getEscalatorStatusByName(stationName, stationCode, type);

        const filtered = res.filter((r) => {
          if (type === "EV") return r.type?.toUpperCase() === "EV";
          if (type === "ES") return r.type?.toUpperCase() === "ES";
          return true;
        });

        const mapped = filtered.map((r, i) => ({
          id: `${r.stationCode || r.STN_CD}-${i}`,
          title: r.facilityName || (type === "EV" ? "엘리베이터" : "에스컬레이터"),
          desc: [r.section, r.position].filter(Boolean).join(" "),
          status: r.status || "-",
          line: r.line || line,
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
