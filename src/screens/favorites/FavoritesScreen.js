// src/screens/favorites/FavoritesScreen.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FavoritesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>즐겨찾기 기능은 현재 개발 중입니다.</Text>
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
    fontSize: 18,
    fontFamily: 'NotoSansKR',
    color: '#888',
  },
});

export default FavoritesScreen;