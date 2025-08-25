// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 화면 컴포넌트들을 import 합니다.
import SignUpScreen from './src/screens/SignUpScreen.js';
// import LoginScreen from './src/screens/LoginScreen'; // 추후 로그인 화면 추가
// import MainTabNavigator from './src/navigation/MainTabNavigator'; // 추후 메인 화면 네비게이터 추가

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* 앱 실행 시 가장 먼저 보여줄 화면을 설정합니다. */}
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ title: '회원가입' }} 
        />
        {/* TODO: 추후 로그인 및 메인 화면을 추가할 때 아래 주석을 해제하세요.
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} /> 
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
