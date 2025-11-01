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
 * ✅ 로컬 지하철 시설 정보를 불러오는 훅
 * - 실시간 API 실패 시 로컬 JSON으로 폴백
 * - WC(휠체어 급속충전)는 API 전용 → 빈 배열 반환
 * - 서울역 예외 처리 (항상 “서울역”으로 통일)
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

        // ✅ “서울” → “서울역” 강제 통일
        let cleanName = stationName.trim();
        if (cleanName === "서울") cleanName = "서울역";

        switch (type) {
          case "EV": // 엘리베이터
            result = await getElevatorsByCode(String(stationCode));
            break;

          case "ES": // 에스컬레이터
            result = await getEscalatorsForStation(cleanName, line, stationCode);
            break;

          case "LO": // 물품보관함
            result = await getLockersForStation(cleanName, line, stationCode);
            break;

          case "NU": // 수유실
            result = await getNursingRoomsForStation(cleanName, line, stationCode);
            break;

          case "VO": { // 음성유도기 (역명+stationCode 병용)
            const byCode = await getAudioBeaconsForStation(cleanName, line, stationCode);
            if (byCode.length > 0) {
              result = byCode;
            } else {
              // ✅ stationCode 매칭 안 될 경우 자동 fallback → 역명 검색
              const byName = await getAudioBeaconsForStation(cleanName, line);
              result = byName;
            }
            break;
          }

          case "WL": // 휠체어 리프트
            result = await getWheelchairLiftsForStation(cleanName, line, stationCode);
            break;

          case "DT": // 장애인 화장실
            result = await getDisabledToiletsForStation(cleanName, line, stationCode);
            break;

          case "TO": // 일반 화장실
            result = await getToiletsForStation(cleanName, line, stationCode);
            break;

          case "WC": // ✅ 휠체어 급속충전 (API 전용)
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
