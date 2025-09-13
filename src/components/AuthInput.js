// src/components/AuthInput.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../styles/authStyles';

const AuthInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  isPassword = false,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(isPassword);
  // ✨ 1. '포커스' 상태를 기억할 변수 추가
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {/* ✨ 2. 포커스 상태에 따라 스타일을 동적으로 적용 */}
      <View style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          isFocused ? styles.inputFocused : null 
        ]}>
        <TextInput
          style={styles.inputInner}
          placeholder={placeholder}
          placeholderTextColor="#888888"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          // ✨ 3. 입력창이 클릭되면 isFocused를 true로,
          onFocus={() => setIsFocused(true)}
          // ✨ 4. 다른 곳을 클릭해서 포커스가 해제되면 false로 변경
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeIcon}>
            <Feather name={isSecure ? "eye-off" : "eye"} size={22} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default AuthInput;
