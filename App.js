import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Image } from 'react-native';
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
import ChatBotScreen from './src/screens/chatbot/ChatBotScreen';
import StationFacilitiesScreen from './src/screens/station/StationFacilitiesScreen';
import StationDetailScreen from './src/screens/station/StationDetailScreen';

const Stack = createStackNavigator();
const RootStack = createStackNavigator(); // 전역 푸시용
const Tab = createBottomTabNavigator();

// --- 공통 탭 스크린 옵션 ---
const commonTabOptions = {
  headerShown: true,
  headerTitleAlign: 'center',
  headerStyle: { backgroundColor: '#F9F9F9', elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
  tabBarActiveTintColor: '#17171B',
  tabBarInactiveTintColor: 'gray',
  tabBarStyle: {
    height: 90,
    backgroundColor: '#F9F9F9',
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
  },
  tabBarLabelStyle: {
    fontSize: 16,
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    marginBottom: 5,
  },
};

// --- 비로그인 탭 ---
const GuestTabs = () => {
  const navigation = useNavigation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          const iconColor = focused ? '#14CAC9' : 'gray';
          if (route.name === '홈') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === '가까운 역') iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
          else if (route.name === '검색') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === '마이') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen
        name="홈"
        component={MainScreen}
        options={{ title: '홈', accessibilityLabel: '홈 화면' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Welcome');
          },
        }}
      />
      <Tab.Screen name="가까운 역" component={NearbyStationsScreen} options={{ title: '가까운 역', accessibilityLabel: '가까운 역 목록' }} />
      <Tab.Screen name="검색" component={SearchStationScreen} options={{ title: '역 검색', accessibilityLabel: '역 검색' }} />
      <Tab.Screen
        name="마이"
        component={MyPageScreen}
        options={{ title: '마이', accessibilityLabel: '마이페이지' }}
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

// --- 로그인 탭 (챗봇 탭을 실제 화면으로 연결) ---
const UserTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...commonTabOptions,
      tabBarIcon: ({ focused, size }) => {
        const iconColor = focused ? '#14CAC9' : 'gray';

        if (route.name === '챗봇') {
          return (
            <Image
              source={require('./src/assets/brand-icon.png')}
              accessibilityLabel="챗봇과 대화하기"
              style={{
                width: 70,
                height: 70,
                tintColor: focused ? iconColor : undefined,
                marginBottom: 15,
              }}
            />
          );
        }

        let iconName;
        if (route.name === '홈') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === '가까운 역') iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
        else if (route.name === '검색') iconName = focused ? 'search' : 'search-outline';
        else if (route.name === '마이') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={iconColor} />;
      },
    })}
  >
    <Tab.Screen name="홈" component={MainScreen} options={{ title: '홈', accessibilityLabel: '홈 화면' }} />
    <Tab.Screen name="가까운 역" component={NearbyStationsScreen} options={{ title: '가까운 역', accessibilityLabel: '가까운 역 목록' }} />
    {/* ✅ 챗봇 탭을 실제 ChatBotScreen으로 연결 */}
    <Tab.Screen
      name="챗봇"
      component={ChatBotScreen}
      options={{ title: '챗봇', accessibilityLabel: '챗봇과 대화하기' }}
    />
    <Tab.Screen name="검색" component={SearchStationScreen} options={{ title: '역 검색', accessibilityLabel: '역 검색' }} />
    <Tab.Screen name="마이" component={MyPageScreen} options={{ title: '마이', accessibilityLabel: '마이페이지' }} />
  </Tab.Navigator>
);

// --- 인증 스택 ---
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

// --- 전역 스택: 탭 + (시설/역상세) 푸시 가능 ---
const AppRoot = () => (
  <RootStack.Navigator>
    {/* 탭 전체 */}
    <RootStack.Screen name="Tabs" component={AppStack} options={{ headerShown: false }} />
    {/* 전역 푸시: 시설 화면(= 한눈/자세히 토글 단일 화면) */}
    <RootStack.Screen name="시설" component={StationFacilitiesScreen} />
    {/* 필요 시 유지: 상세 라우트 (호환용) */}
    <RootStack.Screen name="역상세" component={StationDetailScreen} options={{ title: '역 상세' }} />
  </RootStack.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [fontsLoaded] = useFonts({
    NotoSansKR: require('./src/assets/fonts/NotoSansKR-VariableFont_wght.ttf'),
    NotoSans: require('./src/assets/fonts/NotoSans-VariableFont_wdth,wght.ttf'),
    'NotoSans-Italic': require('./src/assets/fonts/NotoSans-Italic-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) GoogleSignin.configure({ webClientId });
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* 로그인 전엔 AuthStack, 로그인 후엔 AppRoot(탭+시설/상세) */}
      {user ? <AppRoot /> : <AuthStack />}
    </NavigationContainer>
  );
}
