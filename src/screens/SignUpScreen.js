// src/screens/SignUpScreen.js
import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthForm } from '../hook/useAuthForm';
import { signUp } from '../api/auth';
import AuthInput from '../components/AuthInput';
import { styles } from '../styles/authStyles';

const SignUpScreen = ({ navigation }) => {
  const {
    email,
    password,
    confirmPassword,
    emailError,
    passwordError,
    confirmPasswordError,
    setPassword,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    validateEmail,
    validatePassword,
    setEmailError,
    setPasswordError,
    setConfirmPasswordError,
  } = useAuthForm();

  const handleSignUp = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    let isValid = true;

    if (!validateEmail(email) || !email) {
      if (!email) setEmailError('이메일 주소를 입력해주세요.');
      isValid = false;
    }
    if (!validatePassword(password) || !password) {
      if (!password) setPasswordError('비밀번호를 입력해주세요.');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      isValid = false;
    }
    if (!isValid) return;

    const { user, error } = await signUp(email, password);

    if (error) {
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        Alert.alert('오류', '회원가입 중 알 수 없는 오류가 발생했습니다.');
      }
    } else {
      console.log('회원가입 성공!', user.email);
      Alert.alert('회원가입 성공', '회원가입이 완료되었습니다.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={60} 
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>회원가입</Text>
        
        <AuthInput
          label="이메일 주소"
          placeholder="hamkkenuri@example.com"
          value={email}
          onChangeText={handleEmailChange}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthInput
          label="비밀번호"
          placeholder="8자리 이상 입력하세요."
          value={password}
          onChangeText={handlePasswordChange}
          error={passwordError}
          isPassword={true}
        />
        <AuthInput
          label="비밀번호 확인"
          placeholder="비밀번호 확인을 입력하세요"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          error={confirmPasswordError}
          isPassword={true}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>가입하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
