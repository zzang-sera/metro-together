// src/api/metro/metroAPI.js
import { SUPABASE_URL } from "../../constants/constants";
import localStationImages from "../../assets/metro-data/metro/station/station_images.json";

/**
 * ✅ 승강기/에스컬레이터 정보
 * - Supabase Edge Function: /metro-escalators
 * - 네가 준 원본 로직을 그대로 유지
 */
export async function getEscalatorStatusByName(stationName, stationCode, type) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({
    stationName,
    stationCode: stationCode || "",
    type: type || "",
  });

  const url = `${SUPABASE_URL}/functions/v1/metro-escalators?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("🚨 getEscalatorStatusByName error:", e);
    throw e;
  }
}

/**
 * ✅ 화장실 정보 (일반)
 * - 서울 열린데이터 '편의시설위치정보 화장실 현황' 기반
 * - Supabase Edge Function: /metro-toilets
 * - 네가 준 원본 로직을 그대로 유지
 */
export async function getToiletStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({ stationName });
  const url = `${SUPABASE_URL}/functions/v1/metro-toilets?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("🚨 getToiletStatusByName error:", e);
    throw e;
  }
}

/**
 * ✅ 장애인 화장실 정보
 * - 서울 열린데이터 '교통약자이용정보 장애인화장실 현황' 기반
 * - Supabase Edge Function: /metro-toilets-disabled
 * - 네가 준 원본 로직을 그대로 유지
 */
export async function getDisabledToiletStatusByName(stationName) {
  if (!stationName) throw new Error("역 이름이 필요합니다.");

  const params = new URLSearchParams({ stationName });
  const url = `${SUPABASE_URL}/functions/v1/metro-toilets-disabled?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("🚨 getDisabledToiletStatusByName error:", e);
    throw e;
  }
}

/**
 * ✅ 비상대피도 이미지 (역 도면)
 * - 외부 API 말고, 로컬 JSON(station_images.json)에서만 조회
 * - JSON 스키마: { DESCRIPTION, DATA:[{ sttn, sbwy_rout_ln, img_nm, img_link, ... }] }
 * - stationName은 "역" 유무에 상관없이 매칭
 */
export async function getStationImageByName(stationName) {
  try {
    if (!stationName) return [];

    const baseName = String(stationName).replace(/역$/u, ""); // 끝의 "역"만 제거
    const found = localStationImages?.DATA?.find(
      (it) => String(it.sttn).replace(/역$/u, "") === baseName
    );

    if (!found) {
      console.warn(`⚠️ ${stationName}의 도면 이미지가 station_images.json에 없습니다.`);
      return [];
    }

    // 로컬 JSON의 img_link(공공데이터 정적 URL)를 그대로 반환
    return [
      {
        line: String(found.sbwy_rout_ln),
        station: String(found.sttn),
        image: { uri: String(found.img_link) }, // Image component에 그대로 넣을 수 있는 형태
        fileName: String(found.img_nm),
      },
    ];
  } catch (e) {
    console.error("🚨 getStationImageByName error:", e);
    return [];
  }
}
