// src/api/metro/facilities.js
// 시설 유형 키 → 실제 조회 함수 라우팅
import { summarizeElevators } from './elevator';

// FacilitiesSection.js 안에 FAC가 이미 export 되어 있다면 그걸 import 해서 써도 됨.
// 여기선 문자열 상수만 사용 (키 값만 일치하면 됨)
export const FAC_KEYS = {
  ELEVATOR: 'elevator',
  ESCALATOR: 'escalator',
  ACCESSIBLE_TOILET: 'accessible_toilet',
  WHEELCHAIR_LIFT: 'wheelchair_lift',
  WIDE_GATE: 'wide_gate',
  NURSING: 'nursing_room',
  LOCKER: 'locker',
  AUDIO_GUIDE: 'audio_beacon',
  PRIORITY_SEAT: 'priority_seat',
};

/**
 * 시설별 위치 요약 텍스트 반환
 */
export async function getFacilitySummary(stationName, key) {
  switch (key) {
    case FAC_KEYS.ELEVATOR:
      return summarizeElevators(stationName, 6);
    // TODO: 나머지 키들은 해당 API 파악 후 연결
    case FAC_KEYS.ESCALATOR:
    case FAC_KEYS.ACCESSIBLE_TOILET:
    case FAC_KEYS.WHEELCHAIR_LIFT:
    case FAC_KEYS.WIDE_GATE:
    case FAC_KEYS.NURSING:
    case FAC_KEYS.LOCKER:
    case FAC_KEYS.AUDIO_GUIDE:
    case FAC_KEYS.PRIORITY_SEAT:
      return '곧 제공 예정입니다. (API 연동 대기)';
    default:
      return '알 수 없는 시설 유형입니다.';
  }
}
