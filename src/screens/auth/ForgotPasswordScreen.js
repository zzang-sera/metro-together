// src/screens/ForgotPasswordScreen.js
import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthForm } from '../../hook/useAuthForm';
import { resetPassword } from '../../api/auth';
import AuthInput from '../../components/AuthInput';
import { styles } from '../../styles/authStyles';
import CustomButton from '../../components/CustomButton';

const ForgotPasswordScreen = ({ navigation }) => {
  const {
    email,
    emailError,
    handleEmailChange,
    validateEmail,
    setEmailError,
  } = useAuthForm();

  const handlePasswordReset = async () => {
    if (!validateEmail(email) || !email) {
      if (!email) setEmailError('이메일 주소를 입력해주세요.');
      return;
    }

    const { success, error } = await resetPassword(email);

    if (success) {
      Alert.alert(
        '이메일 전송 완료',
        '비밀번호를 재설정할 수 있는 링크를 보냈습니다. 이메일을 확인해주세요.',
        [{ text: '확인', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      if (error.code === 'auth/user-not-found') {
        setEmailError('가입되지 않은 이메일입니다.');
      } else {
        Alert.alert('오류', '이메일 전송에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container} keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>비밀번호 찾기</Text>
        <Text style={styles.description}>가입하신 이메일 주소를 입력하시면{"\n"}비밀번호 재설정 링크를 보내드립니다.</Text>
        
        <AuthInput
          label="이메일 주소"
          value={email}
          onChangeText={handleEmailChange}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <CustomButton
          type="primary"
          title="재설정 이메일 보내기"
          onPress={handlePasswordReset}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;
