// src/screens/auth/WelcomeScreen.js

import React from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, Image } from 'react-native';
import { styles } from '../../styles/authStyles';
import { signInWithGoogle } from '../../api/auth';
import FeatureButton from '../../components/FeatureButton';

const WelcomeScreen = ({ navigation }) => {
  const handleGoogleLogin = async () => {
    const { user, error } = await signInWithGoogle();
    if (error) {
      Alert.alert('로그인 오류', '구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleFeaturePress = (featureName) => {
    Alert.alert('알림', `${featureName} 기능은 현재 준비 중입니다.`);
  };

  return (
    <SafeAreaView style={styles.startContainer}>
      {/* 1. 상단 네비게이션 바 영역 */}
      <View style={styles.header}>
        <Image 
          source={require('../../../assets/favicon.png')} // assets 폴더에 로고 이미지 경로를 맞춰주세요.
          style={styles.logoImage} // 이미지 스타일 적용
          resizeMode="contain" // 이미지 비율 유지하며 컨테이너에 맞춤
        />
      </View>
      
      {/* 2. 메인 콘텐츠 영역 (설명 텍스트) */}
      <View style={styles.content}>
        <Text style={styles.descriptionText}>
          모두를 위한 지하철 이용 도우미,{'\n'}함께타요입니다.
        </Text>
      </View>

      {/* 3. 하단 버튼 통합 영역 */}
      <View style={styles.buttonContainer}>
        <FeatureButton 
          title="가까운 역 안내" 
          onPress={() => handleFeaturePress('가까운 역 안내')} 
        />
        <FeatureButton 
          title="원하는 역 검색" 
          onPress={() => handleFeaturePress('원하는 역 검색')} 
        />
        
        <TouchableOpacity 
          style={styles.outlineButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.outlineButtonText}>이메일로 시작하기</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.outlineButton}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.outlineButtonText}>Google 계정으로 로그인</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          회원 가입 시 즐겨찾기, 챗봇 기능을 사용할 수 있습니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;