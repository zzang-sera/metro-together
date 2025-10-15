// src/api/http.js
import { Platform } from 'react-native';

/**
 * ???꾩뿭 API 踰좎씠??URL
 * - .env / app.json ??EXPO_PUBLIC_API_BASE 媛 ?덉쑝硫?洹멸구 ?곌퀬
 * - ?놁쑝硫??쇰떒 https://example.invalid 濡??붾떎 (?ㅼ닔濡??뚮━吏 ?딄쾶).
 */
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE
  || 'https://example.invalid';

/**
 * JSON留?諛쏆븘?ㅼ씠???덉쟾 fetch.
 * ?쒕쾭媛 HTML(<!DOCTYPE ...>)??二쇰㈃ 諛붾줈 ?먮윭瑜??섏졇??
 * "Value <!DOCTYPE ...>" 媛숈? ?щ옒?쒕? 誘몃━ 李⑤떒?쒕떎.
 */
export async function safeGetJson(url, options) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(options?.headers || {}) },
    ...options,
  });

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();

  if (!res.ok) {
    // 30x/40x/50x ?ы븿 ??HTML ?먮윭?섏씠吏硫??ш린???≫옒
    throw new Error(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 200)}`);
  }
  if (!ct.includes('application/json')) {
    // ?꾨줉??由щ떎?대젆???쒕뵫?섏씠吏 ??HTML 諛⑹뼱
    throw new Error(`Not JSON (content-type=${ct})\n${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}\n${text.slice(0, 200)}`);
  }
}

/**
 * 媛쒕컻 以묒뿏 ?대?留?硫뷀듃濡??붾쾭嫄?二쇱냼瑜??덈? ?곗? 留?寃?
 * ?꾨옒 臾몄옄?댁씠 肄붾뱶???⑥븘?덉쑝硫??꾪뿕 ?좏샇.
 */
export const FORBIDDEN_HINTS = ['://10.', '://192.168.', ':8081', ':8082', 'devtools', 'chrome-devtools', 'metro'];
