import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm } from '../../hook/useAuthForm';
import { signIn } from '../../api/auth';
import AuthInput from '../../components/AuthInput';
import CustomButton from '../../components/CustomButton'; 
import { styles } from '../../styles/authStyles';

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
      console.error("로그인 시도 중 상세 오류:", error); 
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 다시 확인해주세요.');
    } else {
      console.log('로그인 성공!', user.email);
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

        <CustomButton
          type="primary"
          title="로그인"
          onPress={handleLogin}
        />

        <View style={styles.bottomNavContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomNavLink}>회원가입</Text>
          </TouchableOpacity>
          <Text style={styles.bottomNavSeparator}>|</Text>
          <TouchableOpacity onPress={() => { navigation.navigate('FindEmail') }}>
            <Text style={styles.bottomNavLink}>이메일 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.bottomNavSeparator}>|</Text>
          <TouchableOpacity onPress={() => { navigation.navigate('ForgotPassword') }}>
            <Text style={styles.bottomNavLink}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

