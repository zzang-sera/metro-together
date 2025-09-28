// src/screens/main/MainScreen.js
import React from 'react';
import { View, SafeAreaView, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mainStyles } from '../../styles/mainStyles';
import CustomButton from '../../components/CustomButton';
import { auth } from '../../config/firebaseConfig';

const MainScreen = () => {
  const navigation = useNavigation();

  const goTab = (name) => {
    // 같은 TabNavigator 안이므로 바로 이름으로 이동
    navigation.navigate(name);
    // 만약 이 화면이 탭 바깥에서 렌더링된다면 아래 주석처럼 사용
    // navigation.navigate('Tabs', { screen: name });
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
      <View style={mainStyles.header}>
        <Text style={mainStyles.greetingText}>
          {auth.currentUser?.email}님,{"\n"}환영합니다!
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
      </View>
    </SafeAreaView>
  );
};

export default MainScreen;
