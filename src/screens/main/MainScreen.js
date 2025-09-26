import React from 'react';
// ✨ 1. StyleSheet와 반응형 유틸리티 import는 이제 필요 없습니다.
import { View, SafeAreaView, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// ✨ 2. 새로 만드신 mainStyles.js 파일을 import 합니다.
import { mainStyles } from '../../styles/mainStyles';
import CustomButton from '../../components/CustomButton';
import { auth } from '../../config/firebaseConfig';

const MainScreen = () => {
  const navigation = useNavigation();

  const handleFeaturePress = (featureName) => {
    Alert.alert('알림', `${featureName} 기능은 현재 준비 중입니다.`);
  };

  return (
    // ✨ 3. mainStyles를 사용하도록 적용합니다.
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
          onPress={() => navigation.navigate('안내')}
        />
        <CustomButton
          type="feature"
          title="원하는 역 검색"
          onPress={() => navigation.navigate('검색')}
        />
        <CustomButton
          type="outline"
          title="즐겨찾기"
          onPress={() => handleFeaturePress('즐겨찾기')}
        />
        <CustomButton
          type="outline"
          title="챗봇"
          onPress={() => handleFeaturePress('챗봇')}
        />
      </View>
    </SafeAreaView>
  );
};

// ✨ 4. 파일 내부에 있던 스타일 정의를 모두 삭제하여 코드를 깔끔하게 정리했습니다.

export default MainScreen;

