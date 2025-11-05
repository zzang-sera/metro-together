// src/utils/responsive.js

import { Dimensions, PixelRatio } from 'react-native';

const FIGMA_WIDTH = 375;
const FIGMA_HEIGHT = 812; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * @param {number} width 
 * @returns {number} 
 */
export const responsiveWidth = (width) => {
  const percentage = (width / FIGMA_WIDTH) * 100;
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * @param {number} height 
 * @returns {number} 
 */
export const responsiveHeight = (height) => {
  const percentage = (height / FIGMA_HEIGHT) * 100;
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};


/**
 * @param {number} size 
 * @returns {number} 
 */
export const responsiveFontSize = (size) => {
  const scale = SCREEN_WIDTH / FIGMA_WIDTH;
  const newSize = size * scale;
  return PixelRatio.roundToNearestPixel(newSize);
};