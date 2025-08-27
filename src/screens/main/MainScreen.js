// src/screens/MainScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { auth } from '../../config/firebaseConfig'; // Firebase auth 객체
import { logout } from '../../api/auth'; // 로그아웃 API 함수
import { styles } from '../../styles/authStyles'; // 기존 스타일 재사용

const MainScreen = () => {
  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error("로그아웃 오류:", error);
    } else {
      console.log("로그아웃 성공!");
    }
  };

  return (
    <View style={styles.startContainer}>
      {/* 현재 로그인된 사용자 이메일 표시 */}
      <Text style={styles.title}>
        {auth.currentUser?.email}님,{"\n"}환영합니다!
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MainScreen;
