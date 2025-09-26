import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';


// --- 화면 컴포넌트들 ---
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindEmailScreen from './src/screens/auth/FindEmailScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import MainScreen from './src/screens/main/MainScreen';
import MyPageScreen from './src/screens/auth/MyPageScreen';
import NearbyStationsScreen from './src/screens/nearbystation/NearbyStationsScreen';
import SearchStationScreen from './src/screens/searchstation/SearchStationScreen';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


// --- 공통 탭 스크린 옵션 ---
const commonTabOptions = {
  headerShown: true,
  headerTitleAlign: 'center',
  headerStyle: { backgroundColor: '#F9F9F9', elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
  tabBarActiveTintColor: '#14CAC9',
  tabBarInactiveTintColor: 'gray',
};


// --- 비로그인 사용자를 위한 탭 네비게이터 ---
const GuestTabs = () => {
  const navigation = useNavigation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === '홈') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === '안내') iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
          else if (route.name === '검색') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === '마이') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="홈"
        component={MainScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert(
              '로그인 필요',
              '서비스를 이용하려면 로그인이 필요합니다.\n로그인 화면으로 이동하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { text: '확인', onPress: () => navigation.navigate('Welcome') },
              ]
            );
          },
        }}
      />
      <Tab.Screen name="안내" component={NearbyStationsScreen} options={{ title: '가까운 역 목록' }} />
      <Tab.Screen name="검색" component={SearchStationScreen} options={{ title: '역 검색' }} />
      <Tab.Screen
        name="마이"
        component={MyPageScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert(
              '로그인 필요',
              '마이페이지를 보려면 로그인이 필요합니다.\n로그인 화면으로 이동하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { text: '확인', onPress: () => navigation.navigate('Welcome') },
              ]
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};


// --- 로그인한 사용자를 위한 탭 네비게이터 ---
const UserTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...commonTabOptions,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === '홈') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === '안내') iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
        else if (route.name === '검색') iconName = focused ? 'search' : 'search-outline';
        else if (route.name === '마이') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="홈" component={MainScreen} options={{ title: '홈' }} />
    <Tab.Screen name="안내" component={NearbyStationsScreen} options={{ title: '가까운 역 목록' }} />
    <Tab.Screen name="검색" component={SearchStationScreen} options={{ title: '역 검색' }} />
    <Tab.Screen name="마이" component={MyPageScreen} options={{ title: '마이페이지' }} />
  </Tab.Navigator>
);


// --- 화면 그룹 (Stacks) ---
const AuthStack = () => (
  <Stack.Navigator initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' }} />
    <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }} />
    <Stack.Screen name="FindEmail" component={FindEmailScreen} options={{ title: '이메일 찾기' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '비밀번호 찾기' }} />
    <Stack.Screen name="GuestTabs" component={GuestTabs} options={{ headerShown: false }} />
  </Stack.Navigator>
);


const AppStack = () => <UserTabs />;


export default function App() {
  const [user, setUser] = useState(null);
  const [fontsLoaded] = useFonts({
    'NotoSansKR': require('./src/assets/fonts/NotoSansKR-VariableFont_wght.ttf'),
    'NotoSans': require('./src/assets/fonts/NotoSans-VariableFont_wdth,wght.ttf'),
    'NotoSans-Italic': require('./src/assets/fonts/NotoSans-Italic-VariableFont_wdth,wght.ttf'),
  });


  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) GoogleSignin.configure({ webClientId });
    const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
    return unsubscribe;
  }, []);


  if (!fontsLoaded) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }


  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}





