// src/screens/auth/LoginScreen.js

import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm } from '../../hook/useAuthForm';
import { signIn } from '../../api/auth';
import AuthInput from '../../components/AuthInput';
import CustomButton from '../../components/CustomButton'; 
import { styles } from '../../styles/authStyles';

// 1. 필요한 훅과 유틸리티를 불러옵니다.
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';

const LoginScreen = ({ navigation }) => {
  // 2. Context에서 fontOffset 값을 가져옵니다.
  const { fontOffset } = useFontSize();
  
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
      console.error("로그인 시도 중 상세 오류:", error); 
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 다시 확인해주세요.');
    } else {
      console.log('로그인 성공!', user.email);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container} keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* 3. 각 Text 컴포넌트에 동적 폰트 크기를 적용합니다. */}
        <Text style={[styles.title, { fontSize: responsiveFontSize(28) + fontOffset }]}>
          로그인
        </Text>
        
        {/* AuthInput과 CustomButton은 내부적으로 수정했으므로 그대로 사용하면 됩니다. */}
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
        <CustomButton
          type="primary"
          title="로그인"
          onPress={handleLogin}
        />

        <View style={styles.bottomNavContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.bottomNavLink, { fontSize: responsiveFontSize(16) + fontOffset }]}>회원가입</Text>
          </TouchableOpacity>
          <Text style={[styles.bottomNavSeparator, { fontSize: responsiveFontSize(16) + fontOffset }]}>|</Text>
          <TouchableOpacity onPress={() => { navigation.navigate('FindEmail') }}>
            <Text style={[styles.bottomNavLink, { fontSize: responsiveFontSize(16) + fontOffset }]}>이메일 찾기</Text>
          </TouchableOpacity>
          <Text style={[styles.bottomNavSeparator, { fontSize: responsiveFontSize(16) + fontOffset }]}>|</Text>
          <TouchableOpacity onPress={() => { navigation.navigate('ForgotPassword') }}>
            <Text style={[styles.bottomNavLink, { fontSize: responsiveFontSize(16) + fontOffset }]}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;