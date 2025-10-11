import React, { useState } from 'react';
import { View, SafeAreaView, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mainStyles } from '../../styles/mainStyles';
import CustomButton from '../../components/CustomButton';
import { auth } from '../../config/firebaseConfig';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import FontSettingModal from '../../components/FontSettingModal';

const MainScreen = () => {
  const navigation = useNavigation();
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
      <FontSettingModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <View style={mainStyles.header}>
        <Text style={[mainStyles.greetingText, { fontSize: responsiveFontSize(22) + fontOffset }]}>
          {auth.currentUser?.displayName || auth.currentUser?.email}님,{"\n"}환영합니다!
        </Text>
      </View>

      <View style={mainStyles.buttonContainer}>
        <CustomButton
          type="feature"
          title="가까운 역 안내"
          // 👇 [수정] '가까운 역' -> '주변'으로 목적지 변경
          onPress={() => goTab('주변')}
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

