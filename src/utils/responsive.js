// src/utils/responsive.js

import { Dimensions, PixelRatio } from 'react-native';

// 피그마 디자인의 기준이 되는 스크린 크기 (px)
const FIGMA_WIDTH = 375;
const FIGMA_HEIGHT = 812; // iPhone X, 11 Pro 기준 높이

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 피그마의 너비 값을 현재 스크린 너비 비율에 맞게 변환합니다.
 * @param {number} width - 피그마에서의 너비 값 (px)
 * @returns {number} - 현재 기기에 맞는 너비 값
 */
export const responsiveWidth = (width) => {
  const percentage = (width / FIGMA_WIDTH) * 100;
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * 피그마의 높이 값을 현재 스크린 높이 비율에 맞게 변환합니다.
 * @param {number} height - 피그마에서의 높이 값 (px)
 * @returns {number} - 현재 기기에 맞는 높이 값
 */
export const responsiveHeight = (height) => {
  const percentage = (height / FIGMA_HEIGHT) * 100;
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};


/**
 * 폰트 크기를 반응형으로 조절합니다.
 * @param {number} size - 피그마에서의 폰트 크기 (pt)
 * @returns {number} - 현재 기기에 맞는 폰트 크기
 */
export const responsiveFontSize = (size) => {
  const scale = SCREEN_WIDTH / FIGMA_WIDTH;
  const newSize = size * scale;
  return PixelRatio.roundToNearestPixel(newSize);
};