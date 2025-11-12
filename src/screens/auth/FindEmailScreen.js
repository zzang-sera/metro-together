import React from 'react';
import { Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuthForm, SECURITY_QUESTION } from '../../hook/useAuthForm';
import { findUserByDetails } from '../../api/user'; 
import AuthInput from '../../components/AuthInput';
import { styles } from '../../styles/authStyles';
import CustomButton from '../../components/CustomButton';

import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';

const FindEmailScreen = ({ navigation }) => {
  const { fontOffset } = useFontSize();
  
  const {
    name, setName, nameError, setNameError,
    dob, setDob, dobError, setDobError,
    securityAnswer, setSecurityAnswer, securityAnswerError, setSecurityAnswerError,
  } = useAuthForm();

  const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const [domainName, topLevelDomain] = domain.split('.');
    const maskedLocalPart = localPart.substring(0, 3) + '*'.repeat(localPart.length - 3);
    const maskedDomainName = domainName.substring(0, 1) + '*'.repeat(domainName.length - 1);
    return `${maskedLocalPart}@${maskedDomainName}.${topLevelDomain}`;
  };

  const handleFindEmail = async () => {
    let isValid = true;
    if (!name) { setNameError('이름을 입력해주세요.'); isValid = false; }
    if (!dob) { setDobError('생년월일을 입력해주세요.'); isValid = false; }
    if (!securityAnswer) { setSecurityAnswerError('질문에 대한 답변을 입력해주세요.'); isValid = false; }
    if (!isValid) return;

    const { email, error } = await findUserByDetails(name, dob, securityAnswer);

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
        <Text style={[styles.title, { fontSize: responsiveFontSize(28) + fontOffset }]}>
          이메일 찾기
        </Text>
        
        <AuthInput label="이름" value={name} onChangeText={setName} error={nameError} />
        <AuthInput label="생년월일" placeholder="8자리 입력 (예: 19900101)" value={dob} onChangeText={setDob} error={dobError} keyboardType="number-pad" />

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
          title="이메일 찾기"
          onPress={handleFindEmail}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FindEmailScreen;
