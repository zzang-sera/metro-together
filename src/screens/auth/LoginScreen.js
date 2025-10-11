import React from 'react';
import { Text, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm } from '../../hook/useAuthForm';
import { signIn } from '../../api/auth';
import AuthInput from '../../components/AuthInput';
import CustomButton from '../../components/CustomButton'; 
import { styles } from '../../styles/authStyles';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';

const LoginScreen = ({ navigation }) => {
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
        <Text style={[styles.title, { fontSize: responsiveFontSize(28) + fontOffset }]}>로그인</Text>
        
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

        {/* --- 👇 [수정] 불필요한 View를 제거하고 버튼들을 직접 나열 --- */}
        <CustomButton
          type="outline"
          title="회원가입"
          onPress={() => navigation.navigate('SignUp')}
        />
        <CustomButton
          type="outline"
          title="이메일 찾기"
          onPress={() => navigation.navigate('FindEmail')}
        />
        <CustomButton
          type="outline"
          title="비밀번호 찾기"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

