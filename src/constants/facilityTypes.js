// src/constants/facilityTypes.js
export const TYPES = {
  ELEVATOR: "elevator",
  ESCALATOR: "escalator",
  ACCESSIBLE_TOILET: "accessible_toilet",
  WHEELCHAIR_LIFT: "wheelchair_lift",
  WIDE_GATE: "wide_gate",
  NURSING: "nursing_room",
  LOCKER: "locker",
  AUDIO_GUIDE: "audio_beacon",
  PRIORITY_SEAT: "priority_seat",
};

export const TYPE_LABEL = {
  [TYPES.ELEVATOR]: "?섎━踰좎씠??,
  [TYPES.ESCALATOR]: "?먯뒪而щ젅?댄꽣",
  [TYPES.WHEELCHAIR_LIFT]: "?좎껜?대━?꾪듃",
  [TYPES.AUDIO_GUIDE]: "?뚯꽦 ?좊룄湲?,
  [TYPES.PRIORITY_SEAT]: "?몄빟?먯꽍",
  [TYPES.WIDE_GATE]: "愿묓룺 媛쒖같援?,
  [TYPES.ACCESSIBLE_TOILET]: "?μ븷???붿옣??,
  [TYPES.LOCKER]: "臾쇳뭹蹂닿???,
  [TYPES.NURSING]: "?섏쑀??,
};

export const MOVE_FACILITIES = [
  { key: TYPES.ELEVATOR,        label: "?섎━踰좎씠???꾩튂",   icon: "cube-outline" },
  { key: TYPES.ESCALATOR,       label: "?먯뒪而щ젅?댄꽣 ?꾩튂", icon: "trending-up-outline" },
  { key: TYPES.WHEELCHAIR_LIFT, label: "?좎껜?대━?꾪듃 ?꾩튂", icon: "accessibility-outline" },
  { key: TYPES.AUDIO_GUIDE,     label: "?뚯꽦 ?좊룄湲??꾩튂",  icon: "volume-high-outline" },
  { key: TYPES.PRIORITY_SEAT,   label: "?몄빟?먯꽍 ?꾩튂",     icon: "people-outline" },
  { key: TYPES.WIDE_GATE,       label: "愿묓룺 媛쒖같援??꾩튂",  icon: "scan-outline" },
];

export const CONVENIENCE = [
  { key: TYPES.ACCESSIBLE_TOILET, label: "?μ븷???붿옣???꾩튂", icon: "male-female-outline" },
  { key: TYPES.LOCKER,            label: "臾쇳뭹蹂닿????꾩튂",     icon: "briefcase-outline" },
  { key: TYPES.NURSING,           label: "?섏쑀???꾩튂",         icon: "medkit-outline" },
];

export const normalizeType = (t) => String(t || "").trim().toLowerCase();
