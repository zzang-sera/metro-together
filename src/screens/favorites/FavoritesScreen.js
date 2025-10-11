//src/screens/favorites/FavoritesScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 1. 필요한 훅과 유틸리티를 불러옵니다.
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';

const FavoritesScreen = () => {
  // 2. Context에서 fontOffset 값을 가져옵니다.
  const { fontOffset } = useFontSize();

  return (
    <View style={styles.container}>
      {/* 3. Text 컴포넌트에 동적 폰트 크기를 적용합니다. */}
      <Text style={[styles.text, { fontSize: responsiveFontSize(18) + fontOffset }]}>
        즐겨찾기 기능은 현재 개발 중입니다.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  text: {
    // 4. StyleSheet의 fontSize도 responsiveFontSize로 통일합니다.
    fontSize: responsiveFontSize(18),
    fontFamily: 'NotoSansKR',
    color: '#888',
  },
});

export default FavoritesScreen;