// src/screens/auth/WelcomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../../styles/authStyles';
import { signInWithGoogle } from '../../api/auth';

const WelcomeScreen = ({ navigation }) => {
  const handleGoogleLogin = async () => {
    const { user, error } = await signInWithGoogle();
    if (error) {
      Alert.alert('로그인 오류', '구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
    // 성공 시 App.js의 onAuthStateChanged가 감지하여 자동으로 메인 화면으로 이동합니다.
  };

  return (
    <View style={styles.startContainer}>
      <Text style={styles.title}>Metro Together</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>이메일로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleLogin}
      >
        <Text style={styles.buttonText}>Google 계정으로 로그인</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;
