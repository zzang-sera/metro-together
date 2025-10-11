// src/screens/main/MainScreen.js (수정된 코드)

import React, { useState } from 'react'; // --- 1. useState 추가 ---
import { View, SafeAreaView, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mainStyles } from '../../styles/mainStyles';
import CustomButton from '../../components/CustomButton';
import { auth } from '../../config/firebaseConfig';

// --- 2. 필요한 훅과 컴포넌트, 유틸리티 추가 ---
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import FontSettingModal from '../../components/FontSettingModal';

const MainScreen = () => {
  const navigation = useNavigation();
  // --- 3. 모달 표시 상태와 Context 훅 사용 ---
  const [isModalVisible, setModalVisible] = useState(false);
  const { fontOffset } = useFontSize();

  const goTab = (name) => {
    navigation.navigate(name);
  };

  const handleFeaturePress = (featureName) => {
    Alert.alert('알림', `${featureName} 기능은 현재 준비 중입니다.`);
  };

  const handleChatbotPress = () => {
    if (auth.currentUser) {
      goTab('챗봇');
    } else {
      Alert.alert(
        '로그인 필요',
        '챗봇은 로그인 후 이용할 수 있습니다.\n로그인 화면으로 이동할까요?',
        [
          { text: '취소', style: 'cancel' },
          { text: '확인', onPress: () => navigation.navigate('Welcome') },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={mainStyles.container}>
      {/* --- 4. 모달 컴포넌트 추가 --- */}
      <FontSettingModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <View style={mainStyles.header}>
        {/* --- 5. 글자 크기 동적 적용 --- */}
        <Text style={[mainStyles.greetingText, { fontSize: responsiveFontSize(22) + fontOffset }]}>
          {auth.currentUser?.displayName || auth.currentUser?.email}님,{"\n"}환영합니다!
        </Text>
      </View>

      <View style={mainStyles.buttonContainer}>
        <CustomButton
          type="feature"
          title="가까운 역 안내"
          onPress={() => goTab('가까운 역')}
        />
        <CustomButton
          type="feature"
          title="원하는 역 검색"
          onPress={() => goTab('검색')}
        />
        <CustomButton
          type="outline"
          title="즐겨찾기"
          onPress={() => handleFeaturePress('즐겨찾기')}
        />
        <CustomButton
          type="outline"
          title="챗봇"
          onPress={handleChatbotPress}
        />
        {/* --- 6. 글자 크기 설정 버튼 추가 --- */}
        <CustomButton
          type="outline"
          title="글자 크기 설정"
          onPress={() => setModalVisible(true)}
        />
      </View>
    </SafeAreaView>
  );
};

export default MainScreen;