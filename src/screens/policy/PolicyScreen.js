//src/screens/policy/PolicyScreen.js
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
// 1. 필요한 훅과 유틸리티를 불러옵니다.
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';

const PolicyScreen = ({ navigation }) => {
  // 2. Context에서 fontOffset 값을 가져옵니다.
  const { fontOffset } = useFontSize();
  const route = useRoute();
  const { title, content } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <ScrollView style={styles.container}>
      {/* 3. Text 컴포넌트에 동적 폰트 크기를 적용합니다. */}
      <Text style={[styles.content, { fontSize: responsiveFontSize(14) + fontOffset }]}>
        {content}
      </Text>
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
    // 4. responsiveWidth -> responsiveFontSize 로 수정 (코드 정확성 향상)
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    lineHeight: responsiveHeight(24),
    color: '#17171B',
  },
});

export default PolicyScreen;
