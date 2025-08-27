// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth'; // ✨ Firebase 인증 상태 리스너
import { auth } from './src/config/firebaseConfig'; // ✨ Firebase auth 객체

import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindEmailScreen from './src/screens/auth/FindEmailScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen'; 
import MainScreen from './src/screens/main/MainScreen'; // 로그인 후 메인 화면

const Stack = createStackNavigator();

// 로그인/회원가입 등 인증 관련 화면 그룹
const AuthStack = () => (
  <Stack.Navigator initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' }} />
    <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }} />
    <Stack.Screen name="FindEmail" component={FindEmailScreen} options={{ title: '이메일 찾기' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '비밀번호 찾기' }} />
  </Stack.Navigator>
);

// 로그인 후 사용할 앱의 메인 화면 그룹
const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Main" component={MainScreen} options={{ title: '메인' }} />
  </Stack.Navigator>
);

export default function App() {
  // 사용자 로그인 상태를 저장할 state
  const [user, setUser] = useState(null);

  // 앱이 처음 실행될 때 Firebase의 로그인 상태를 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // 로그인/로그아웃 시 user 상태 업데이트
    });
    return unsubscribe; // 앱이 꺼질 때 리스너 정리
  }, []);

  return (
    <NavigationContainer>
      {/* user 상태에 따라 보여줄 화면 그룹을 결정 */}
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}