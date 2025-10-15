// src/services/facilityLoaders.js
import { TYPES } from "../constants/facilityTypes";
import { getElevatorsByCode } from "../api/elevLocal";
import { getEscalatorsForStation } from "../api/escalatorLocal";
import { getAudioBeaconsForStation } from "../api/voiceLocal";
import { getWheelchairLiftsForStation } from "../api/wheelchairLiftLocal";
import { getLockersForStation } from "../api/lockerLocal";
import { getNursingRoomsForStation } from "../api/nursingRoomLocal";

// ?꾩튂 ?ㅻ챸?먯꽌 異쒓뎄/?대? ?ㅼ썙???뚯떛
export function parseExit(position = "") {
  const s = String(position);
  const m = s.match(/(\d+)\s*踰?s*異????援?);
  if (m) return `${m[1]}踰?異쒓뎄`;
  if (/?대?|??⑹떎|??Т??媛쒗몴???섏듅|?듬줈/.test(s)) return "?대?";
  return "?꾩튂 誘몄긽";
}
const fakeDistance = () => "00m";

export async function loadFacilitiesByType(type, params) {
  const { stationCode, stationName, line } = params;
  switch (type) {
    case TYPES.ELEVATOR: {
      const rows = (await getElevatorsByCode(String(stationCode))) || [];
      return rows.map((r, i) => {
        const exit = parseExit(r.position || r.section || "");
        return {
          id: `${r.stationCode}-elev-${i}`,
          title: `${exit}?먯꽌 ${fakeDistance()}`,
          rawExit: exit,
          status: r.status === "N" ? "怨좎옣" : "?뺤긽",
        };
      });
    }
    case TYPES.ESCALATOR:
      return (await getEscalatorsForStation(stationName, line)).map((r, i) => ({
        id: `${stationName}-esca-${i}`,
        title: `${r.title} 쨌 ${fakeDistance()}`,
        rawExit: parseExit(r.desc || r.title),
        status: r.status || "?뺤긽",
      }));
    case TYPES.AUDIO_GUIDE:
      return (await getAudioBeaconsForStation(stationName, line, stationCode)).map((r, i) => ({
        id: `${stationName}-audio-${i}`,
        title: `${r.desc} 쨌 ${fakeDistance()}`,
        rawExit: parseExit(r.desc),
        status: r.status || "?뺤긽",
      }));
    case TYPES.WHEELCHAIR_LIFT:
      return (await getWheelchairLiftsForStation(stationName, line)).map((r, i) => ({
        id: `${stationName}-lift-${i}`,
        title: `${r.title} 쨌 ${fakeDistance()}`,
        rawExit: parseExit(r.desc),
        status: r.status || "?뺤긽",
      }));
    case TYPES.LOCKER:
      return (await getLockersForStation(stationName, line)).map((r, i) => ({
        id: `${stationName}-locker-${i}`,
        title: `${r.title} 쨌 ${fakeDistance()}`,
        rawExit: parseExit(r.desc || r.title),
        status: r.status || "?뺤긽",
      }));
    case TYPES.NURSING:
      return (await getNursingRoomsForStation(stationName, line)).map((r, i) => ({
        id: `${stationName}-nur-${i}`,
        title: `${r.title} 쨌 ${fakeDistance()}`,
        rawExit: parseExit(r.desc || r.title),
        status: r.status || "?뺤긽",
      }));
    // 異뷀썑 PRIORITY_SEAT, WIDE_GATE, ACCESSIBLE_TOILET??媛숈? ?⑦꽩?쇰줈 異붽?
    default:
      return [];
  }
}
