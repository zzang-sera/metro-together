// src/config/seoul.js
import Constants from 'expo-constants';

/**
 * dev(로컬)과 prod(EAS 빌드) 모두에서 안전하게 읽기
 * - dev: Constants.expoConfig?.extra
 * - prod: Constants.manifest?.extra (일부 런타임)
 */
const EXTRA = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
export const SEOUL_KEY = EXTRA.SEOUL_KEY;

if (!SEOUL_KEY) {
  // 앱이 뜨긴 뜨게 하되, 콘솔에서 원인 바로 보이게
  console.warn('[SEOUL] 앱 설정에 SEOUL_KEY가 없습니다. app.json > expo.extra.SEOUL_KEY 확인!');
}
