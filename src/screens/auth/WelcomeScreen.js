// src/screens/WelcomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/authStyles'; // 기존 스타일 재사용

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.startContainer}>
      <Text style={styles.title}>Metro Together</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>이메일로 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;
