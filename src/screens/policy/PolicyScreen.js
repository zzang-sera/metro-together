// src/screens/policy/PolicyScreen.js

import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
// 👇 [1. 수정] useNavigation을 더 이상 사용하지 않으므로 import 문 정리
import { useRoute } from '@react-navigation/native';
import { responsiveWidth, responsiveHeight } from '../../utils/responsive';

// 👇 [2. 수정] 컴포넌트가 navigation을 직접 prop으로 받도록 변경
const PolicyScreen = ({ navigation }) => {
  const route = useRoute();
  const { title, content } = route.params;

  // 헤더 제목을 동적으로 변경하기 위해 navigation을 사용
  React.useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.content}>{content}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: responsiveWidth(16),
  },
  content: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveWidth(14),
    fontWeight: '700',
    lineHeight: responsiveHeight(24),
    color: '#17171B',
  },
});

export default PolicyScreen;