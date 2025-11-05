import elevJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";


function pickArray(any) {
  if (Array.isArray(any)) return any;
  if (Array.isArray(any?.DATA)) return any.DATA;
  if (Array.isArray(any?.row)) return any.row;
  for (const k of Object.keys(any || {})) {
    const v = any[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray(v.row)) return v.row;
      if (Array.isArray(v.DATA)) return v.DATA;
    }
  }
  return [];
}

function sanitizeName(s = "") {
  return typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";
}

function koStatus(v = "") {
  if (v === "Y") return "사용가능";
  if (v === "N") return "중지";
  return v || "-";
}


function toPretty(raw) {
  const stationCode = String(
    raw.stn_cd ?? raw.STN_CD ?? raw.station_cd ?? raw.code ?? raw.stationCode ?? ""
  ).trim();

  const stationNameFull =
    raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? raw.stationName ?? "";
  const stationName = sanitizeName(stationNameFull);

  const facilityName = raw.elvtr_nm ?? raw.ELVTR_NM ?? raw.facilityName ?? "";
  const section = raw.opr_sec ?? raw.OPR_SEC ?? raw.section ?? "";
  const gate = raw.instl_pstn ?? raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const status = koStatus(raw.use_yn ?? raw.USE_YN ?? raw.status ?? "");
  const kind = raw.elvtr_se ?? raw.ELVTR_SE ?? raw.kind ?? "";
  const line = String(raw.line ?? raw.LINE_NUM ?? raw.lineName ?? "").trim();

  return { stationCode, stationName, facilityName, section, gate, status, kind, line };
}


const RAW_ROWS = pickArray(elevJson);
const INDEX_BY_CODE = new Map(); 
const INDEX_BY_NAME = new Map(); 

for (const r of RAW_ROWS) {
  const code = String(
    r.stn_cd ?? r.STN_CD ?? r.station_cd ?? r.code ?? r.stationCode ?? ""
  ).trim();
  const name = sanitizeName(
    r.stn_nm ?? r.STN_NM ?? r.station_nm ?? r.name ?? r.stationName ?? ""
  );

  if (code) {
    const a = INDEX_BY_CODE.get(code) || [];
    a.push(r);
    INDEX_BY_CODE.set(code, a);
  }
  if (name) {
    const b = INDEX_BY_NAME.get(name) || [];
    b.push(r);
    INDEX_BY_NAME.set(name, b);
  }
}

export async function getElevByCode(code) {
  const k = String(code || "").trim();
  if (!k) return [];
  const rows = INDEX_BY_CODE.get(k) || [];
  return rows.slice();
}

export async function getElevByName(name) {
  const k = sanitizeName(name || "");
  if (!k) return [];
  const rows = INDEX_BY_NAME.get(k) || [];
  return rows.slice();
}

export function prettify(rows) {
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map(toPretty);
}

export function searchElev(query) {
  const q = String(query || "").trim();
  if (!q) return [];
  if (/^\d+$/.test(q)) return prettify(INDEX_BY_CODE.get(q) || []);
  return prettify(INDEX_BY_NAME.get(sanitizeName(q)) || []);
}

export function getElevatorsByCode(stnCd) {
  const k = String(stnCd || "").trim();
  const rows = INDEX_BY_CODE.get(k) || [];
  if (!rows.length) return null;
  return rows.map((r) => ({
    type: r.elvtr_se ?? r.ELVTR_SE ?? r.kind ?? "",
    name: r.elvtr_nm ?? r.ELVTR_NM ?? r.facilityName ?? "",
    status: r.use_yn ?? r.USE_YN ?? r.status ?? "",
    section: r.opr_sec ?? r.OPR_SEC ?? r.section ?? "",
    position: r.instl_pstn ?? r.INSTL_PSTN ?? r.location ?? r.gate ?? "",
    stationCode:
      r.stn_cd ?? r.STN_CD ?? r.station_cd ?? r.code ?? r.stationCode ?? "",
    stationName: sanitizeName(
      r.stn_nm ?? r.STN_NM ?? r.station_nm ?? r.name ?? r.stationName ?? ""
    ),
    line: r.line ?? r.LINE_NUM ?? r.lineName ?? "",
  }));
}
