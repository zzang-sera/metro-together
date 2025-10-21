// ✅ src/hook/useLocalFacilities.js
import { useEffect, useState } from "react";
import { getElevatorsByCode } from "../api/metro/elevLocal";
import { getEscalatorsForStation } from "../api/metro/escalatorLocal";
import { getLockersForStation } from "../api/metro/lockerLocal";
import { getNursingRoomsForStation } from "../api/metro/nursingRoomLocal";
import { getAudioBeaconsForStation } from "../api/metro/voiceLocal";
import { getWheelchairLiftsForStation } from "../api/metro/wheelchairLiftLocal";
import { getDisabledToiletsForStation } from "../api/metro/disabled_toiletLocal";
import { getToiletsForStation } from "../api/metro/toiletLocal";

/**
 * 로컬 지하철 시설 정보를 불러오는 훅
 * 실시간 API → 실패 시 로컬 JSON으로 폴백하도록 구성할 때 사용
 */
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

        switch (type) {
          case "EV": // 엘리베이터
            result = await getElevatorsByCode(String(stationCode));
            break;
          case "ES": // 에스컬레이터
            result = await getEscalatorsForStation(stationName, line);
            break;
          case "LO": // 물품보관함
            result = await getLockersForStation(stationName, line);
            break;
          case "NU": // 수유실
            result = await getNursingRoomsForStation(stationName, line);
            break;
          case "VO": // 음성유도기
            result = await getAudioBeaconsForStation(stationName, line);
            break;
          case "WL": // 휠체어 리프트
            result = await getWheelchairLiftsForStation(stationName, line);
            break;
          case "DT": // 장애인 화장실
            result = await getDisabledToiletsForStation(stationName, line);
            break;
          case "TO": // 일반 화장실
            result = await getToiletsForStation(stationName, line);
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
