import { Dimensions, PixelRatio } from 'react-native';

// 피그마 디자인의 기준이 되는 스크린 너비 (px)
const FIGMA_WIDTH = 375; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 피그마의 너비 값을 현재 스크린 너비 비율에 맞게 변환합니다.
 * @param {number} width - 피그마에서의 너비 값 (px)
 * @returns {number} - 현재 기기에 맞는 너비 값
 */
export const widthPercentage = (width) => {
  const percentage = (width / FIGMA_WIDTH) * 100;
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * 폰트 크기를 반응형으로 조절하되, WCAG 기준을 위해 최소 크기를 보장합니다.
 * @param {number} size - 피그마에서의 폰트 크기 (pt)
 * @returns {number} - 현재 기기에 맞는 폰트 크기
 */
export const responsiveFontSize = (size) => {
  const scale = SCREEN_WIDTH / FIGMA_WIDTH;
  const newSize = size * scale;
  
  // WCAG 접근성 기준을 위해 최소 폰트 크기를 16px로 제한합니다.
  const MIN_FONT_SIZE = 16; 
  
  return Math.max(MIN_FONT_SIZE, PixelRatio.roundToNearestPixel(newSize));
};

