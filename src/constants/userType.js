// src/constants/userType.js

export const USER_TYPES = {
  DEFAULT: "DEFAULT",          // 일반 사용자
  VISUAL: "VISUAL",            // 시각 약자
  WHEELCHAIR: "WHEELCHAIR",    // 휠체어 이용자
};

// 화면에서 표시용 라벨 (필요하면 가져다 쓰기)
export const USER_TYPE_LABELS = {
  [USER_TYPES.DEFAULT]: "일반",
  [USER_TYPES.VISUAL]: "시각",
  [USER_TYPES.WHEELCHAIR]: "휠체어",
};
