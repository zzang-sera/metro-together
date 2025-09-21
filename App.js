import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// --- 인증 화면들 ---
// 아래 경로들은 실제 파일 위치에 맞게 확인해주세요.
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindEmailScreen from './src/screens/auth/FindEmailScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// --- 메인 앱 화면들 ---
import MainScreen from './src/screens/main/MainScreen';
import NearbyStationsScreen from './src/screens/nearbystation/NearbyStationsScreen';

// "검색", "마이" 탭을 위한 임시 화면
const SearchScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>검색 화면</Text></View>;
const MyScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>마이 페이지</Text></View>;


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 1. 하단 탭 네비게이터를 별도의 컴포넌트로 생성합니다.
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === '홈') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === '안내') {
          iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
        } else if (route.name === '검색') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === '마이') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#00B8D4', // 활성 탭 아이콘 및 텍스트 색상
      tabBarInactiveTintColor: 'gray',   // 비활성 탭 아이콘 및 텍스트 색상
    })}
  >
    <Tab.Screen name="홈" component={MainScreen} />
    <Tab.Screen name="안내" component={NearbyStationsScreen} />
    <Tab.Screen name="검색" component={SearchScreen} />
    <Tab.Screen name="마이" component={MyScreen} />
  </Tab.Navigator>
);

// 2. 로그인 전 인증 관련 화면 그룹
const AuthStack = () => (
  <Stack.Navigator initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' }} />
    <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }} />
    <Stack.Screen name="FindEmail" component={FindEmailScreen} options={{ title: '이메일 찾기' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '비밀번호 찾기' }} />
  </Stack.Navigator>
);

// 3. 로그인 후 사용할 메인 앱 그룹 (StackNavigator 구조 유지)
const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabScreen" 
      component={MainTabs} 
      options={{ headerShown: false }} // 탭 화면 자체의 헤더는 숨기고, 각 탭이 자체 헤더를 갖도록 합니다.
    />
    {/* 여기에 나중에 탭 바가 없는 다른 화면들(ex: 설정 페이지)을 추가할 수 있습니다. */}
    {/* 예시: <Stack.Screen name="Settings" component={SettingsScreen} /> */}
  </Stack.Navigator>
);

// 4. 앱의 최상위 컴포넌트
export default function App() {
  const [user, setUser] = useState(null);

  // 앱이 처음 실행될 때 Firebase의 로그인 상태를 실시간으로 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // 로그인/로그아웃 시 user 상태 업데이트
    });
    return unsubscribe; // 컴포넌트가 사라질 때 리스너 정리
  }, []);

  return (
    <NavigationContainer>
      {/* user 로그인 상태에 따라 보여줄 화면 그룹을 결정 */}
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

