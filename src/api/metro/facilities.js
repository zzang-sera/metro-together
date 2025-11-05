import { summarizeElevators } from './elevator';

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

export async function getFacilitySummary(stationName, key) {
  switch (key) {
    case FAC_KEYS.ELEVATOR:
      return summarizeElevators(stationName, 6);
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
