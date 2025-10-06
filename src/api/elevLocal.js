// src/api/elevLocal.js
import elevData from "../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json" assert { type: "json" };

const byCode = new Map();
for (const row of elevData.DATA || []) {
  const code = row.stn_cd?.toString();
  if (!code) continue;
  const arr = byCode.get(code) || [];
  arr.push(row);
  byCode.set(code, arr);
}

export function getElevatorsByCode(stnCd) {
  const rows = byCode.get(stnCd);
  if (!rows) return null;
  return rows.map(r => ({
    type: r.elvtr_se,
    name: r.elvtr_nm,
    status: r.use_yn,
    section: r.opr_sec,
    position: r.instl_pstn,
    stationCode: r.stn_cd,
    stationName: r.stn_nm,
  }));
}
