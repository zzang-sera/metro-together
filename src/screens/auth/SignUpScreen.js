//src/screens/auth/SignUpScreen.js
import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm, SECURITY_QUESTION } from '../../hook/useAuthForm';
import { signUp } from '../../api/auth';
import { saveUserInfo } from '../../api/user';
import AuthInput from '../../components/AuthInput';
import { styles } from '../../styles/authStyles';
import CustomButton from '../../components/CustomButton';

import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';

const SignUpScreen = ( ) => {
  const { fontOffset } = useFontSize();

  const {
    name, setName, nameError, setNameError,
    dob, setDob, dobError, setDobError,
    email, emailError, setEmailError,
    password, passwordError, setPasswordError,
    confirmPassword, confirmPasswordError, setConfirmPasswordError,
    securityAnswer, setSecurityAnswer, securityAnswerError, setSecurityAnswerError,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    validateEmail,
    validatePassword,
  } = useAuthForm();

  const handleSignUp = async () => {
    console.log("--- 회원가입 버튼 클릭됨 ---");
    console.log("입력된 값:", { name, dob, email, password, confirmPassword, securityAnswer });

    setNameError('');
    setDobError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setSecurityAnswerError('');
    let isValid = true;

    if (!name) {
      setNameError('이름을 입력해주세요.');
      isValid = false;
      console.log("유효성 검사 실패: 이름이 비어있습니다.");
    }
    if (!dob) {
      setDobError('생년월일을 입력해주세요.');
      isValid = false;
      console.log("유효성 검사 실패: 생년월일이 비어있습니다.");
    }
    if (!validateEmail(email) || !email) {
      if (!email) setEmailError('이름을 입력해주세요.');
      isValid = false;
      console.log("유효성 검사 실패: 이메일이 비어있거나 형식이 틀렸습니다.");
    }
    if (!validatePassword(password) || !password) {
      if (!password) setPasswordError('비밀번호를 입력해주세요.');
      isValid = false;
      console.log("유효성 검사 실패: 비밀번호가 비어있거나 8자리 미만입니다.");
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      isValid = false;
      console.log("유효성 검사 실패: 비밀번호가 일치하지 않습니다.");
    }
    if (!securityAnswer) {
      setSecurityAnswerError('질문에 대한 답변을 입력해주세요.');
      isValid = false;
      console.log("유효성 검사 실패: 본인 확인 답변이 비어있습니다.");
    }

    if (!isValid) {
      console.log("--- 유효성 검사 실패로 회원가입 중단 ---");
      return;
    }

    console.log("--- 유효성 검사 통과, Firebase에 등록 시도 ---");
    const { user, error } = await signUp(email, password);

    if (error) {
      console.error("Firebase Auth 오류:", error);
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('비밀번호는 8자리 이상이어야 합니다.');
      } else {
        Alert.alert('오류', '회원가입 중 알 수 없는 오류가 발생했습니다.');
      }
    } else {
      console.log("--- Firebase Auth 등록 성공, Firestore에 추가 정보 저장 시도 ---");
      const userInfoResult = await saveUserInfo(user.uid, user.email, name, dob, SECURITY_QUESTION, securityAnswer);
      if (userInfoResult.success) {
        console.log("--- 모든 과정 성공 ---");
        Alert.alert('회원가입 성공', '회원가입이 완료되었습니다.');
      } else {
        console.error("Firestore 저장 오류:", userInfoResult.error);
        Alert.alert('오류', '사용자 정보 저장에 실패했습니다.');
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container} keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { fontSize: responsiveFontSize(28) + fontOffset }]}>
          회원가입
        </Text>
        
        <AuthInput label="이름" value={name} onChangeText={setName} error={nameError} />
        <AuthInput label="생년월일" placeholder="8자리 입력 (예: 19900101)" value={dob} onChangeText={setDob} error={dobError} keyboardType="number-pad" />
        <AuthInput label="이메일 주소" value={email} placeholder="hamkke@example.com" onChangeText={handleEmailChange} error={emailError} keyboardType="email-address" autoCapitalize="none" />
        <AuthInput label="비밀번호" placeholder="8자리 이상 입력" value={password} onChangeText={handlePasswordChange} error={passwordError} isPassword={true} />
        <AuthInput label="비밀번호 확인" value={confirmPassword} onChangeText={handleConfirmPasswordChange} error={confirmPasswordError} isPassword={true} />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            본인 확인 질문
          </Text>
          <View style={styles.questionBox}>
            <Text style={[styles.questionText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
              {SECURITY_QUESTION}
            </Text>
          </View>
        </View>
        <AuthInput label="질문에 대한 답변" value={securityAnswer} onChangeText={setSecurityAnswer} error={securityAnswerError} />

        <CustomButton
          type="primary"
          title="회원가입"
          onPress={handleSignUp}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
