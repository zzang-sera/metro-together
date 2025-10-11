//src/screens/auth/MyPageScreen.js
import React, { useState } from 'react'; // 1. useState 추가
import { View, StyleSheet, Text } from 'react-native'; // 1. Text 추가
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { styles as authStyles } from '../../styles/authStyles'; 

// 2. 필요한 훅과 컴포넌트, 유틸리티 추가
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import FontSettingModal from '../../components/FontSettingModal';

const MyPageScreen = () => {
  const navigation = useNavigation();
  // 3. 모달 상태와 Context 훅 사용
  const [isModalVisible, setModalVisible] = useState(false);
  const { fontOffset } = useFontSize();

  return (
    <View style={[authStyles.container, styles.contentContainer]}>
      {/* 4. 모달 컴포넌트 추가 */}
      <FontSettingModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* 5. 화면 제목 추가 및 동적 폰트 크기 적용 */}
      <Text style={[styles.title, { fontSize: responsiveFontSize(24) + fontOffset }]}>
        마이페이지
      </Text>

      {/* CustomButton들은 자동으로 글자 크기가 조절됩니다. */}
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
      {/* 6. 글자 크기 설정 버튼 추가 */}
      <CustomButton
        title="글자 크기 설정"
        onPress={() => setModalVisible(true)}
        type="outline" // 다른 버튼과 구분되도록 outline 스타일 적용
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1, // flex: 1 추가하여 전체 화면 사용
    justifyContent: 'center',
    padding: 24,
  },
  // 7. 제목 스타일 추가
  title: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    textAlign: 'center',
    marginBottom: 40, // 버튼과의 간격
  },
});

export default MyPageScreen;
