// src/hook/useLocalFacilities.js
import { useEffect, useState } from "react";
import { getElevatorsByCode } from "../api/metro/elevLocal";
import { getEscalatorsForStation } from "../api/metro/escalatorLocal";
import { getLockersForStation } from "../api/metro/lockerLocal";

export function useLocalFacilities(stationName, stationCode, line, type) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationName) return;

    async function loadLocal() {
      setLoading(true);
      try {
        let result = [];

        if (type === "EV") {
          result = await getElevatorsByCode(String(stationCode));
        } else if (type === "ES") {
          result = await getEscalatorsForStation(stationName, line);
        } else if (type === "LO") {
          result = await getLockersForStation(stationName, line);
        }

        if (!result || result.length === 0) {
          setError("해당 역의 데이터는 준비 중입니다.");
        }

        setData(result);
      } catch (err) {
        console.error("🚨 로컬 데이터 오류:", err);
        setError(err.message || "로컬 데이터 로드 오류");
      } finally {
        setLoading(false);
      }
    }

    loadLocal();
  }, [stationName, stationCode, line, type]);

  return { data, loading, error };
}
