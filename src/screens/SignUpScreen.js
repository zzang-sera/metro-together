// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig'; // 경로를 ../config/firebase.js 로 수정했습니다.
import { Feather } from '@expo/vector-icons'; // 아이콘 사용을 위해 import

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 비밀번호 보이기/숨기기 상태
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  // 오류 메시지 상태
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 입력 유효성 검사 및 회원가입 처리 함수
  const handleSignUp = async () => {
    // 1. 기존 오류 메시지 초기화
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    let isValid = true;

    // 2. 입력 값 유효성 검사
    if (!email) {
      setEmailError('이메일 주소를 입력해주세요.');
      isValid = false;
    }
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      isValid = false;
    }

    if (!isValid) return;

    // 3. Firebase 회원가입 시도
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('회원가입 성공!', userCredential.user.email);
      Alert.alert('회원가입 성공', '회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.', [
        { text: '확인', onPress: () => {} /* navigation.navigate('Login') */ },
      ]);
    } catch (error) {
      // 4. Firebase 오류 처리
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('유효하지 않은 이메일 형식입니다.');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        Alert.alert('오류', '회원가입 중 알 수 없는 오류가 발생했습니다.');
        console.error(error);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>회원가입</Text>
        
        {/* 이메일 입력 그룹 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label} accessibilityLabel="이메일 주소 입력란">이메일 주소</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityHint="서비스에 사용할 이메일 주소를 입력하세요."
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* 비밀번호 입력 그룹 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label} accessibilityLabel="비밀번호 입력란">비밀번호</Text>
          <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
            <TextInput
              style={styles.inputInner}
              placeholder="6자리 이상 입력"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={securePassword}
              accessibilityHint="서비스에 사용할 비밀번호를 6자리 이상 입력하세요."
            />
            <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
              <Feather name={securePassword ? "eye-off" : "eye"} size={22} color="#666" />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* 비밀번호 확인 그룹 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label} accessibilityLabel="비밀번호 확인 입력란">비밀번호 확인</Text>
          <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
            <TextInput
              style={styles.inputInner}
              placeholder="비밀번호 다시 입력"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirmPassword}
              accessibilityHint="입력한 비밀번호를 다시 한번 입력하여 확인하세요."
            />
            <TouchableOpacity onPress={() => setSecureConfirmPassword(!secureConfirmPassword)} style={styles.eyeIcon}>
              <Feather name={secureConfirmPassword ? "eye-off" : "eye"} size={22} color="#666" />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>

        {/* 회원가입 버튼 */}
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>가입하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 배경색을 흰색으로 변경하여 대비를 높임
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#121212', // 글자색을 더 진하게 변경
    marginBottom: 48,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56, // 높이를 키워 터치 영역 확보
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputInner: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  inputError: {
    borderColor: '#D32F2F', // 오류 시 테두리 색상
    borderWidth: 1.5,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 6,
  },
  button: {
    width: '100%',
    height: 56, // 높이를 키워 터치 영역 확보
    backgroundColor: '#005EB8', // WCAG AA 등급을 만족하는 파란색
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;