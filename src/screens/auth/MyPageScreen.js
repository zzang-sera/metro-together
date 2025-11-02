import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { styles as authStyles } from '../../styles/authStyles'; 
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import FontSettingModal from '../../components/FontSettingModal';
import { logout } from '../../api/auth';

const MyPageScreen = () => {
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false);
  const { fontOffset } = useFontSize();

  const handleLogout = async () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃 하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: async () => await logout() }
      ]
    );
  };

  const handleUsageGuidePress = () => {
  navigation.navigate('Onboarding');
};

  return (
    <View style={[authStyles.container, styles.contentContainer]}>
      <FontSettingModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <Text style={[styles.title, { fontSize: responsiveFontSize(24) + fontOffset }]}>
        마이페이지
      </Text>


      <CustomButton
        title="사용법 다시보기"
        onPress={handleUsageGuidePress}
        type="outline" 
      />
      <CustomButton
        title="글자 크기 설정"
        onPress={() => setModalVisible(true)}
        type="outline"
      />
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
      <CustomButton
        title="로그아웃"
        onPress={handleLogout}
        type="destructive" // 위험/종료를 의미하는 빨간색 버튼
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#17171B',
    textAlign: 'center',
    marginBottom: 40,
  },
});

export default MyPageScreen;

