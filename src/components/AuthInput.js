// src/components/AuthInput.js (수정된 코드)

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles/authStyles';
import { Ionicons } from '@expo/vector-icons'; 

// 1. 필요한 훅과 유틸리티를 불러옵니다.
import { useFontSize } from '../contexts/FontSizeContext';
import { responsiveFontSize } from '../utils/responsive';

const AuthInput = ({ label, value, onChangeText, error, isPassword, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2. Context에서 fontOffset 값을 가져옵니다.
  const { fontOffset } = useFontSize();

  // authStyles.js에서 이 컴포넌트 관련 텍스트들의 기본 크기는 모두 16이었습니다.
  const baseFontSize = 16;

  return (
    <View style={styles.inputGroup}>
      {/* 3. Label 텍스트에 동적 폰트 크기를 적용합니다. */}
      <Text style={[styles.label, { fontSize: responsiveFontSize(baseFontSize) + fontOffset }]}>
        {label}
      </Text>
      
      <View 
        style={[
          styles.inputContainer, 
          isFocused && styles.inputFocused,
          error && styles.inputError
        ]}
      >
        {/* 4. TextInput 자체의 폰트 크기에도 적용합니다. */}
        <TextInput
          style={[styles.inputInner, { fontSize: responsiveFontSize(baseFontSize) + fontOffset }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#6A6A6A"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. Error 텍스트에도 동적 폰트 크기를 적용합니다. */}
      {error && (
        <Text style={[styles.errorText, { fontSize: responsiveFontSize(baseFontSize) + fontOffset }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default AuthInput;