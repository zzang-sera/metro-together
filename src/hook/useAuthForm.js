// src/hook/useAuthForm.js
import { useState } from 'react';
export const SECURITY_QUESTION = "여러분이 다녔던 첫 번째 학교의 이름은 무엇이었습니까?";

export const useAuthForm = () => {
  
  const [name, setName] = useState('');
  const [dob, setDob] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [nameError, setNameError] = useState('');
  const [dobError, setDobError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [securityAnswerError, setSecurityAnswerError] = useState('');

  // 이메일 유효성 검사 함수
  const validateEmail = (text) => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (text && !emailRegex.test(text)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (text) => {
    if (text && text.length < 8) {
      setPasswordError('비밀번호는 8자리 이상이어야 합니다.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    validateEmail(text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validatePassword(text);
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (password !== text) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  };

  return {
    name, setName, nameError, setNameError,
    dob, setDob, dobError, setDobError,
    email, setEmail, emailError, setEmailError,
    password, setPassword, passwordError, setPasswordError,
    confirmPassword, setConfirmPassword, confirmPasswordError, setConfirmPasswordError,
    securityAnswer, setSecurityAnswer, securityAnswerError, setSecurityAnswerError,
    handleEmailChange,handlePasswordChange,handleConfirmPasswordChange,
    validateEmail,validatePassword,
  };
};
