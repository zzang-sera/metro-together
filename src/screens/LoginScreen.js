// src/screens/LoginScreen.js
import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm } from '../hook/useAuthForm'; // hook 폴더로 경로 수정
import { signIn } from '../api/auth';
import AuthInput from '../components/AuthInput';
import { styles } from '../styles/authStyles';

const LoginScreen = ({ navigation }) => {
  const {
    email,
    password,
    emailError,
    passwordError,
    handleEmailChange,
    setPassword,
    setEmailError,
    setPasswordError,
  } = useAuthForm();

  const handleLogin = async () => {
    if (!email || !password) {
      if (!email) setEmailError('이메일을 입력해주세요.');
      if (!password) setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    const { user, error } = await signIn(email, password);

    if (error) {
      // ✨ 1. 디버깅을 위해 실제 오류를 콘솔에 출력합니다.
      console.error("로그인 시도 중 상세 오류:", error); 
      
      // 2. 사용자에게는 간단한 오류 메시지를 보여줍니다.
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 다시 확인해주세요.');
    } else {
      console.log('로그인 성공!', user.email);
      // TODO: 로그인 성공 후 메인 화면으로 이동
      // navigation.navigate('Main');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container} keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>로그인</Text>
        
        <AuthInput
          label="이메일 주소"
          value={email}
          onChangeText={handleEmailChange}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthInput
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          isPassword={true}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>

        <View style={styles.bottomNavContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomNavLink}>회원가입</Text>
          </TouchableOpacity>
          <Text style={styles.bottomNavSeparator}>|</Text>
          <TouchableOpacity onPress={() => { /* TODO: 이메일 찾기 */ }}>
            <Text style={styles.bottomNavLink}>이메일 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.bottomNavSeparator}>|</Text>
          <TouchableOpacity onPress={() => { /* TODO: 비밀번호 찾기 */ }}>
            <Text style={styles.bottomNavLink}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
