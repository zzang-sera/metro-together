import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import { useFonts } from 'expo-font'; // ✨ 1. useFonts 훅 import
import { View, ActivityIndicator } from 'react-native'; // ✨ 2. 로딩 중 UI를 위한 컴포넌트 import

import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindEmailScreen from './src/screens/auth/FindEmailScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen'; 
import MainScreen from './src/screens/main/MainScreen';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' }} />
    <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }} />
    <Stack.Screen name="FindEmail" component={FindEmailScreen} options={{ title: '이메일 찾기' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '비밀번호 찾기' }} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Main" component={MainScreen} options={{ title: '메인' }} />
  </Stack.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);

  // ✨ 3. Variable Fonts 로딩 훅 사용
  const [fontsLoaded] = useFonts({
    // 대표 이름으로 Variable Font 파일을 등록합니다.
    'NotoSansKR': require('./src/assets/fonts/NotoSansKR-VariableFont_wght.ttf'),
    'NotoSans': require('./src/assets/fonts/NotoSans-VariableFont_wdth,wght.ttf'),
    'NotoSans-Italic': require('./src/assets/fonts/NotoSans-Italic-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // ✨ 4. 폰트가 로딩되지 않았으면 로딩 화면을 보여줍니다.
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

