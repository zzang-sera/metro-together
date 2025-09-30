// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Image } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import { useFonts } from 'expo-font';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// --- 화면들 ---
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindEmailScreen from './src/screens/auth/FindEmailScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import MainScreen from './src/screens/main/MainScreen';
import NearbyStationsScreen from './src/screens/nearbystation/NearbyStationsScreen';
import SearchStationScreen from './src/screens/searchstation/SearchStationScreen';
import ChatBotScreen from './src/screens/chatbot/ChatBotScreen';
import StationFacilitiesScreen from './src/screens/station/StationFacilitiesScreen';
import StationDetailScreen from './src/screens/station/StationDetailScreen';
import MyPageScreen from './src/screens/auth/MyPageScreen';
import AccountManagementScreen from './src/screens/auth/AccountManagementScreen';
import FavoritesScreen from './src/screens/favorites/FavoritesScreen';
import PolicyScreen from './src/screens/policy/PolicyScreen';

// --- 네비게이터들 ---
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MyPageStack = createStackNavigator();
const NearbyStack = createStackNavigator();
const SearchStack = createStackNavigator();

// --- 공통 탭 옵션 ---
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

// --- 마이페이지 스택 ---
const MyPageStackNavigator = () => (
  <MyPageStack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: '#F9F9F9', elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: { fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
    }}
  >
    <MyPageStack.Screen name="MyPageMain" component={MyPageScreen} options={{ title: '마이페이지' }} />
    <MyPageStack.Screen name="AccountManagement" component={AccountManagementScreen} options={{ title: '회원관리' }} />
    <MyPageStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: '즐겨찾기' }} />
    <MyPageStack.Screen name="Policy" component={PolicyScreen} options={{ title: '이용약관' }} />
  </MyPageStack.Navigator>
);

// --- 가까운 역 스택(탭 안) → 탭바 유지 ---
const NearbyStackNavigator = () => (
  <NearbyStack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: '#F9F9F9', elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: { fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
    }}
  >
    <NearbyStack.Screen name="NearbyHome" component={NearbyStationsScreen} options={{ title: '가까운 역' }} />
    <NearbyStack.Screen name="시설" component={StationFacilitiesScreen} options={{ title: '시설' }} />
    <NearbyStack.Screen name="역상세" component={StationDetailScreen} options={{ title: '역 상세' }} />
  </NearbyStack.Navigator>
);

// --- 검색 스택(탭 안) → 탭바 유지 ---
const SearchStackNavigator = () => (
  <SearchStack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: '#F9F9F9', elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: { fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
    }}
  >
    <SearchStack.Screen name="SearchHome" component={SearchStationScreen} options={{ title: '역 검색' }} />
    <SearchStack.Screen name="시설" component={StationFacilitiesScreen} options={{ title: '시설' }} />
    <SearchStack.Screen name="역상세" component={StationDetailScreen} options={{ title: '역 상세' }} />
  </SearchStack.Navigator>
);

// --- 비로그인 탭 ---
const GuestTabs = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const tabBarStyle = {
    backgroundColor: '#F9F9F9',
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    paddingBottom: Math.max(8, insets.bottom),
    height: 70 + Math.max(8, insets.bottom),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        tabBarStyle,
        tabBarHideOnKeyboard: true,
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
      {/* 비로그인도 스택으로! → 시설/상세 가도 탭 유지 */}
      <Tab.Screen name="가까운 역" component={NearbyStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="검색" component={SearchStackNavigator} options={{ headerShown: false }} />
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

// --- 로그인 탭 ---
const UserTabs = () => {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    backgroundColor: '#F9F9F9',
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    paddingBottom: Math.max(8, insets.bottom),
    height: 70 + Math.max(8, insets.bottom),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        tabBarStyle,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, size }) => {
          const iconColor = focused ? '#14CAC9' : 'gray';

          if (route.name === '챗봇') {
            return (
              <Image
                source={require('./src/assets/brand-icon.png')}
                accessibilityLabel="챗봇과 대화하기"
                resizeMode="contain"
                style={{
                  width: 70,
                  height: 70,
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
          else iconName = 'ellipse-outline';

          return <Ionicons name={iconName} size={size} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen name="홈" component={MainScreen} options={{ title: '홈' }} />
      <Tab.Screen name="가까운 역" component={NearbyStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="챗봇" component={ChatBotScreen} options={{ title: '챗봇' }} />
      <Tab.Screen name="검색" component={SearchStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="마이" component={MyPageStackNavigator} options={{ title: '마이', headerShown: false }} />
    </Tab.Navigator>
  );
};

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

// --- 앱 루트: 탭만 넣음 (시설/상세는 각 탭 스택에 있음!) ---
const AppStack = () => <UserTabs />;

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
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
