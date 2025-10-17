// src/api/metroAPI.js
import { SUPABASE_URL } from "../constants/constants";

/**
 * ① 기존: 전체 승강기/에스컬레이터 목록 가져오기
 * (테스트용 or 전체 데이터 조회용)
 */
export async function getEscalatorStatus() {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/metro-escalators`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("API fetch error:", e);
    throw e;
  }
}

/**
 * ② 추가: 특정 역(stationName) 기준으로 승강기·에스컬레이터만 가져오기
 * (실제 화면에서 사용)
 */
export async function getMetroFacilitiesByStation(stationName) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/metro-escalators?stationName=${encodeURIComponent(
        stationName
      )}`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 구조 가공해서 보기 쉽게 변환
    return data.map((item) => ({
      id: `${item.stationCode}-${item.facilityName}`,
      stationCode: item.stationCode,
      stationName: item.stationName,
      facilityName: item.facilityName,
      section: item.section || "-",
      position: item.position || "-",
      status: item.status === "사용가능" ? "정상" : "점검중",
      type:
        item.type === "EV"
          ? "엘리베이터"
          : item.type === "ES"
          ? "에스컬레이터"
          : "기타",
    }));
  } catch (e) {
    console.error("getMetroFacilitiesByStation error:", e);
    return [];
  }
}
