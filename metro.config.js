// metro.config.js (Expo 53 / RN 0.79.x 권장 기본값)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 필요하면 여기서 config.resolver.assetExts / sourceExts 등 커스터마이즈 가능
module.exports = config;