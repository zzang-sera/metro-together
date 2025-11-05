// src/components/AuthInput.js (수정된 코드)

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles/authStyles';
import { Ionicons } from '@expo/vector-icons'; 

import { useFontSize } from '../contexts/FontSizeContext';
import { responsiveFontSize } from '../utils/responsive';

const AuthInput = ({ label, value, onChangeText, error, isPassword, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { fontOffset } = useFontSize();

  const baseFontSize = 16;

  return (
    <View style={styles.inputGroup}>
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

      {error && (
        <Text style={[styles.errorText, { fontSize: responsiveFontSize(baseFontSize) + fontOffset }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default AuthInput;