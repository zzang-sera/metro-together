//src/hook/useLocalFacilities.js
import { useEffect, useState } from "react";
import { getFacilityForStation } from "../api/metro/elevEsLocal"
import { getLockersForStation } from "../api/metro/lockerLocal";
import { getNursingRoomsForStation } from "../api/metro/nursingRoomLocal";
import { getAudioBeaconsForStation } from "../api/metro/voiceLocal";
import { getWheelchairLiftsForStation } from "../api/metro/wheelchairLiftLocal";
import { getDisabledToiletsForStation } from "../api/metro/disabled_toiletLocal";
import { getToiletsForStation } from "../api/metro/toiletLocal";

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

        let cleanName = stationName.trim();
        if (cleanName === "서울") cleanName = "서울역";

        switch (type) {
          case "EV": 
          case "ES": 
            result = getFacilityForStation(cleanName, type);
            break;

          case "LO": 
            result = await getLockersForStation(cleanName, line, stationCode);
            break;

          case "NU": 
            result = await getNursingRoomsForStation(cleanName, line, stationCode);
            break;

          case "VO": { 
            const byCode = await getAudioBeaconsForStation(cleanName, line, stationCode);
            if (byCode.length > 0) {
              result = byCode;
            } else {
              const byName = await getAudioBeaconsForStation(cleanName, line);
              result = byName;
            }
            break;
          }

          case "WL": 
            result = await getWheelchairLiftsForStation(cleanName, line, stationCode);
            break;

          case "DT": 
            result = await getDisabledToiletsForStation(cleanName, line, stationCode);
            break;

          case "TO": 
            result = await getToiletsForStation(cleanName, line, stationCode);
            break;

          case "WC": 
            result = [];
            break;

          default:
            console.warn("⚠️ 알 수 없는 시설 타입:", type);
            result = [];
        }

        if (!result || result.length === 0) {
          setError("해당 역의 데이터는 준비 중입니다.");
        } else {
          setError(null);
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
