// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { Feather } from '@expo/vector-icons';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // ✨ 이메일 유효성 검사 함수
  const validateEmail = (text) => {
    // 간단한 정규식을 사용하여 '@'와 '.'이 포함되었는지 확인합니다.
    const emailRegex = /\S+@\S+\.\S+/;
    if (text && !emailRegex.test(text)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
    } else {
      setEmailError('');
    }
  };

  // ✨ 이메일 입력 핸들러
  const handleEmailChange = (text) => {
    setEmail(text);
    validateEmail(text);
  };

  // ✨ 비밀번호 입력 핸들러 (비밀번호 확인란과 실시간 비교)
  const handlePasswordChange = (text) => {
    setPassword(text);
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  };
  
  // ✨ 비밀번호 확인 입력 핸들러
  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (password !== text) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  };

  // 최종 회원가입 처리 함수
  const handleSignUp = async () => {
    // 기존 오류 메시지 초기화
    setPasswordError('');
    let isValid = true;

    // 최종 유효성 검사
    validateEmail(email); // 이메일 형식 최종 확인
    if (emailError || !email) {
        if(!email) setEmailError('이메일 주소를 입력해주세요.');
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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('회원가입 성공!', userCredential.user.email);
      Alert.alert('회원가입 성공', '회원가입이 완료되었습니다.', [
        { text: '확인', onPress: () => {} /* navigation.navigate('Login') */ },
      ]);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('이미 사용 중인 이메일입니다.');
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
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>이메일 주소</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="example@email.com"
            value={email}
            onChangeText={handleEmailChange} // ✨ 핸들러 변경
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호</Text>
          <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
            <TextInput
              style={styles.inputInner}
              placeholder="6자리 이상 입력"
              value={password}
              onChangeText={handlePasswordChange} // ✨ 핸들러 변경
              secureTextEntry={securePassword}
            />
            <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
              <Feather name={securePassword ? "eye-off" : "eye"} size={22} color="#666" />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호 확인</Text>
          <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
            <TextInput
              style={styles.inputInner}
              placeholder="비밀번호 다시 입력"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange} // ✨ 핸들러 변경
              secureTextEntry={secureConfirmPassword}
            />
            <TouchableOpacity onPress={() => setSecureConfirmPassword(!secureConfirmPassword)} style={styles.eyeIcon}>
              <Feather name={secureConfirmPassword ? "eye-off" : "eye"} size={22} color="#666" />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>가입하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#121212',
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
    height: 56,
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
    borderColor: '#D32F2F',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 6,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#005EB8',
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
