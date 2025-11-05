// src/config/seoul.js
import Constants from 'expo-constants';

const EXTRA = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
export const SEOUL_KEY = EXTRA.SEOUL_KEY;

if (!SEOUL_KEY) {
  console.warn('[SEOUL] 앱 설정에 SEOUL_KEY가 없습니다. app.json > expo.extra.SEOUL_KEY 확인!');
}
