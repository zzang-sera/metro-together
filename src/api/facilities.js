import { FAC } from '../screens/station/FacilitiesSection';
import { summarizeElevators } from './elevator';

const label = {
  [FAC.ESCALATOR]: '에스컬레이터',
  [FAC.ELEVATOR]: '엘리베이터',
  [FAC.ACCESSIBLE_TOILET]: '장애인 화장실',
  [FAC.WHEELCHAIR_LIFT]: '휠체어 리프트',
  [FAC.WIDE_GATE]: '광폭 개찰구',
  [FAC.NURSING]: '수유실',
  [FAC.LOCKER]: '물품보관함',
  [FAC.AUDIO_GUIDE]: '음성유도기',
};

export async function getFacilityLocation(stationName, key) {
  switch (key) {
    case FAC.ELEVATOR:
      return await summarizeElevators(stationName);
    default:
      return `${stationName}역의 ${label[key] || '해당 시설'} 위치 데이터는 준비 중입니다.`;
  }
}
