// src/screens/auth/MyPageScreen.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { styles as authStyles } from '../../styles/authStyles'; // authStyles import

const MyPageScreen = () => {
  const navigation = useNavigation();

  return (
    // 👇 [수정] authStyles.container를 적용하고, 내부 요소 정렬을 위한 스타일 추가
    <View style={[authStyles.container, styles.contentContainer]}>
      <CustomButton
        title="즐겨찾기"
        onPress={() => navigation.navigate('Favorites')}
        type="feature"
      />
      <CustomButton
        title="회원관리"
        onPress={() => navigation.navigate('AccountManagement')}
        type="feature"
      />
    </View>
  );
};

// 👇 [수정] MyPageScreen에만 필요한 스타일만 남김
const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: 'center',
    padding: 24,
  },
});

export default MyPageScreen;