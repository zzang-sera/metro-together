// src/screens/FindEmailScreen.js
import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm, SECURITY_QUESTION } from '../../hook/useAuthForm';
import { findUserByInfo } from '../../api/user'; 
import AuthInput from '../../components/AuthInput';
import { styles } from '../../styles/authStyles';
import CustomButton from '../../components/CustomButton';

const FindEmailScreen = ({ navigation }) => {
  const {
    name, setName, nameError, setNameError,
    dob, setDob, dobError, setDobError,
    securityAnswer, setSecurityAnswer, securityAnswerError, setSecurityAnswerError,
  } = useAuthForm();

 // ✨ 이 부분을 아래 새 코드로 바꿔주세요!
  const maskEmail = (email) => {
    // 이메일을 '@' 기준으로 아이디와 도메인으로 나눕니다.
    const [localPart, domain] = email.split('@');
    const [domainName, topLevelDomain] = domain.split('.');

    // 아이디의 앞 3글자만 남기고 나머지는 '*'로 바꿉니다.
    const maskedLocalPart = localPart.substring(0, 3) + '*'.repeat(localPart.length - 3);

    // 도메인의 첫 글자만 남기고 나머지는 '*'로 바꿉니다.
    const maskedDomainName = domainName.substring(0, 1) + '*'.repeat(domainName.length - 1);

    return `${maskedLocalPart}@${maskedDomainName}.${topLevelDomain}`;
  };


  const handleFindEmail = async () => {
    let isValid = true;
    if (!name) { setNameError('이름을 입력해주세요.'); isValid = false; }
    if (!dob) { setDobError('생년월일을 입력해주세요.'); isValid = false; }
    if (!securityAnswer) { setSecurityAnswerError('질문에 대한 답변을 입력해주세요.'); isValid = false; }
    if (!isValid) return;

    const { email, error } = await findUserByInfo(name, dob, securityAnswer);

    if (error === 'NOT_FOUND') {
      Alert.alert('이메일 찾기 실패', '입력하신 정보와 일치하는 사용자가 없습니다.');
    } else if (error) {
      Alert.alert('오류', '이메일을 찾는 중 오류가 발생했습니다.');
    } else {
      const maskedEmail = maskEmail(email);
      Alert.alert('이메일 찾기 성공', `회원님의 이메일은 ${maskedEmail} 입니다.`);
      navigation.navigate('Login');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container} keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>이메일 찾기</Text>
        
        <AuthInput label="이름" value={name} onChangeText={setName} error={nameError} />
        <AuthInput label="생년월일" placeholder="8자리 입력 (예: 19900101)" value={dob} onChangeText={setDob} error={dobError} keyboardType="number-pad" />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>본인 확인 질문</Text>
          <View style={styles.questionBox}><Text style={styles.questionText}>{SECURITY_QUESTION}</Text></View>
        </View>
        <AuthInput label="질문에 대한 답변" value={securityAnswer} onChangeText={setSecurityAnswer} error={securityAnswerError} />

        <CustomButton
          type="primary"
          title="이메일 찾기"
          onPress={handleFindEmail}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FindEmailScreen;
