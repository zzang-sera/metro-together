// App.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert, Image, Dimensions, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StatusBar } from 'expo-status-bar';
import Onboarding from 'react-native-onboarding-swiper';

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { FontSizeProvider, useFontSize } from "./src/contexts/FontSizeContext";
import { responsiveFontSize } from "./src/utils/responsive";

// --- Screens ---
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindEmailScreen from './src/screens/auth/FindEmailScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import MainScreen from './src/screens/main/MainScreen';
import NearbyStationsScreen from './src/screens/nearbystation/NearbyStationsScreen';
import SearchStationScreen from './src/screens/searchstation/SearchStationScreen';
import ChatBotScreen from './src/screens/chatbot/ChatBotScreen';
import StationDetailScreen from './src/screens/station/StationDetailScreen';
import MyPageScreen from './src/screens/auth/MyPageScreen';
import AccountManagementScreen from './src/screens/auth/AccountManagementScreen';
import FavoritesScreen from './src/screens/favorites/FavoritesScreen';
import PolicyScreen from './src/screens/policy/PolicyScreen';
import BarrierFreeMapScreen from './src/screens/station/BarrierFreeMapScreen';
import PathFinderScreen from './src/screens/pathfinder/PathFinderScreen';

// Navigators 정의
const RootStack = createStackNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MyPageStack = createStackNavigator();
const NearbyStack = createStackNavigator();
const SearchStack = createStackNavigator();
const MainStack = createStackNavigator();
const HomeStack = createStackNavigator();
const PathFinderStack = createStackNavigator();

/* ──────────────────────────────
   공통 옵션
────────────────────────────── */
const commonTabOptions = {
  headerShown: true,
  headerTitleAlign: "center",
  headerStyle: { backgroundColor: "#F9F9F9", elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontFamily: "NotoSansKR", fontWeight: "700", color: "#17171B" },
  tabBarActiveTintColor: "#17171B",
  tabBarInactiveTintColor: "gray",
};

const mintHeaderOptions = {
  headerTitleAlign: "center",
  headerStyle: { backgroundColor: "#F9F9F9", elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontFamily: "NotoSansKR", fontWeight: "700", color: "#17171B" },
  headerTintColor: "#17171B",
};

/* ──────────────────────────────
   MainStack
────────────────────────────── */
const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="StationDetail" component={StationDetailScreen} />
    <MainStack.Screen name="BarrierFreeMap" component={BarrierFreeMapScreen} />
  </MainStack.Navigator>
);

/* ──────────────────────────────
   각 스택 네비게이터
────────────────────────────── */
const HomeStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <HomeStack.Navigator
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={MainScreen} options={{ title: '홈' }} />
      <HomeStack.Screen name="MainStack" component={MainStackNavigator} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
};

const MyPageStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <MyPageStack.Navigator
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <MyPageStack.Screen name="MyPageMain" component={MyPageScreen} options={{ title: "내 정보" }} />
      <MyPageStack.Screen name="AccountManagement" component={AccountManagementScreen} options={{ title: "회원관리" }} />
      <MyPageStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "즐겨찾기" }} />
      <MyPageStack.Screen name="Policy" component={PolicyScreen} options={{ title: "이용약관" }} />
      <MyPageStack.Screen name="MainStack" component={MainStackNavigator} options={{ headerShown: false }} />
    </MyPageStack.Navigator>
  );
};

const NearbyStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <NearbyStack.Navigator
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <NearbyStack.Screen name="NearbyHome" component={NearbyStationsScreen} options={{ title: '가까운 역 목록' }} />
      <NearbyStack.Screen name="MainStack" component={MainStackNavigator} options={{ headerShown: false }} />
    </NearbyStack.Navigator>
  );
};

const SearchStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <SearchStack.Navigator
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <SearchStack.Screen name="SearchHome" component={SearchStationScreen} options={{ title: "역 검색" }} />
      <SearchStack.Screen name="MainStack" component={MainStackNavigator} options={{ headerShown: false }} />
    </SearchStack.Navigator>
  );
};

const PathFinderStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <PathFinderStack.Navigator
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <PathFinderStack.Screen name="PathFinderHome" component={PathFinderScreen} options={{ title: '지하철 최단 경로' }} />
      <PathFinderStack.Screen name="StationDetail" component={StationDetailScreen} options={{ headerShown: false }} />
      <PathFinderStack.Screen name="BarrierFreeMap" component={BarrierFreeMapScreen} options={{ headerShown: false }} />
    </PathFinderStack.Navigator>
  );
};

/* ──────────────────────────────
   Guest Tabs
────────────────────────────── */
const GuestTabs = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  const tabBarStyle = {
    backgroundColor: "#F9F9F9",
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    paddingBottom: Math.max(8, insets.bottom),
    height: 70 + Math.max(8, insets.bottom) + fontOffset,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        headerTitleStyle: { ...commonTabOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
        tabBarStyle,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: responsiveFontSize(16) + fontOffset,
          fontFamily: "NotoSansKR",
          fontWeight: "700",
          marginBottom: 5,
        },
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          const iconColor = focused ? "#14CAC9" : "gray";
          const iconSize = size + (fontOffset > 0 ? fontOffset / 2 : fontOffset);
          if (route.name === "홈") iconName = focused ? "home" : "home-outline";
          else if (route.name === "주변") iconName = focused ? "navigate-circle" : "navigate-circle-outline";
          else if (route.name === "검색") iconName = focused ? "search" : "search-outline";
          else if (route.name === "마이") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen
        name="홈"
        component={HomeStackNavigator}
        options={{ headerShown: false }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate("AuthScreens", {
              screen: "Welcome",
              });
          },
        }}
      />
      <Tab.Screen name="주변" component={NearbyStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="검색" component={SearchStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen
        name="마이"
        component={MyPageScreen}
        options={{ title: "마이" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert("로그인 필요", "로그인이 필요합니다.", [
              { text: "취소", style: "cancel" },
              { text: "확인", onPress: () => navigation.getParent()?.navigate("Welcome") },
            ]);
          },
        }}
      />
    </Tab.Navigator>
  );
};

/* ──────────────────────────────
   User Tabs
────────────────────────────── */
const UserTabs = () => {
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();

  const tabBarStyle = {
    backgroundColor: "#F9F9F9",
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    paddingBottom: Math.max(8, insets.bottom),
    height: 70 + Math.max(8, insets.bottom) + fontOffset,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        headerTitleStyle: { ...commonTabOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
        tabBarStyle,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: responsiveFontSize(16) + fontOffset,
          fontFamily: "NotoSansKR",
          fontWeight: "700",
          marginBottom: 5,
        },
        tabBarIcon: ({ focused, size }) => {
          const iconColor = focused ? "#14CAC9" : "gray";
          const iconSize = size + (fontOffset > 0 ? fontOffset / 2 : fontOffset);
          if (route.name === "챗봇") {
            return (
              <Image
                source={require("./src/assets/brand-icon.png")}
                resizeMode="contain"
                style={{
                  width: 70 + fontOffset * 2,
                  height: 70 + fontOffset * 2,
                  marginBottom: 15,
                }}
              />
            );
          }
          let iconName;
          if (route.name === "홈") iconName = focused ? "home" : "home-outline";
          else if (route.name === "주변") iconName = focused ? "navigate-circle" : "navigate-circle-outline";
          else if (route.name === "검색") iconName = focused ? "search" : "search-outline";
          else if (route.name === "마이") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen name="홈" component={HomeStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="주변" component={NearbyStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="챗봇" component={ChatBotScreen} options={{ title: "챗봇" }} />
      <Tab.Screen name="검색" component={SearchStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="마이" component={MyPageStackNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

/* ──────────────────────────────
   Auth Stack
────────────────────────────── */
const AuthStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "로그인" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "회원가입" }} />
      <Stack.Screen name="FindEmail" component={FindEmailScreen} options={{ title: "이메일 찾기" }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "비밀번호 찾기" }} />
      <Stack.Screen name="GuestTabs" component={GuestTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

/* ──────────────────────────────
   Onboarding
────────────────────────────── */
const { width: W, height: H } = Dimensions.get('window');
const IMG_W = Math.min(320, W * 0.82);
const IMG_H = Math.min(IMG_W * 1.95, H * 0.62);
const MINT = "#14CAC9";

const Dot = ({ selected }) => (
  <View
    style={{
      width: selected ? 20 : 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
      backgroundColor: selected ? MINT : "#D7EDEA",
    }}
  />
);

const TextBtn = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
    <Text style={{ fontFamily: "NotoSansKR", fontWeight: "700", color: MINT, fontSize: 16 }}>{label}</Text>
  </TouchableOpacity>
);

function InlineOnboarding({ onFinish }) {
  const titleS = {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    marginTop: -40,
  };
  const subS = { fontFamily: 'NotoSansKR', fontWeight: '500', color: '#17171B', lineHeight: 22 };

  return (
    <Onboarding
      onDone={onFinish}
      onSkip={onFinish}
      titleStyles={titleS}
      subTitleStyles={subS}
      containerStyles={{ paddingHorizontal: 20 }}
      bottomBarColor="#FFFFFF"
      showDone
      showNextButton
      showSkip
      NextButtonComponent={(props) => <TextBtn label="다음" {...props} />}
      SkipButtonComponent={(props) => <TextBtn label="건너뛰기" {...props} />}
      DoneButtonComponent={(props) => <TextBtn label="시작하기" {...props} />}
      DotComponent={Dot}
      pages={[
        {
          backgroundColor: '#FFFFFF',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding1.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="시작하기 화면 예시"
            />
          ),
          title: '시작하기',
          subtitle:
            '이메일 또는 Google로 가입할 수 있어요.\n가입하면 즐겨찾기·챗봇 기능을 사용할 수 있습니다.\n비회원도 앱 기능 대부분을 이용할 수 있어요.',
        },
        {
          backgroundColor: '#F2FFFD',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding2.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="개인설정 화면 예시"
            />
          ),
          title: '개인설정',
          subtitle: '글자 크기를 조절해 가독성을 높이고,\n즐겨찾기한 역을 한눈에 확인하세요.',
        },
        {
          backgroundColor: '#E8FBF9',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding3.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="가까운 역 안내 화면 예시"
            />
          ),
          title: '가까운 역 안내',
          subtitle: '현재 위치 기준 가까운 역을 자동으로 보여줍니다.\n거리와 노선 배지를 함께 확인하세요.',
        },
        {
          backgroundColor: '#F2FFFD',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding4.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 검색 화면 예시"
            />
          ),
          title: '원하는 역 검색',
          subtitle: '역 이름을 입력하면 즉시 결과가 나타납니다.\n선택해 상세 정보 또는 길찾기를 진행하세요.',
        },
        {
          backgroundColor: '#E8FBF9',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding5.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 선택 시 메뉴 예시"
            />
          ),
          title: '역 선택 시 메뉴',
          subtitle: '① 역 정보 보기  ② 출발역으로 길찾기  ③ 도착역으로 길찾기',
        },
        {
          backgroundColor: '#F2FFFD',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding6.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="지하철 최단 경로 화면 예시"
            />
          ),
          title: '지하철 최단 경로',
          subtitle: '배리어프리 경로로 안내합니다.\n소요 시간·환승 횟수와 함께 상세 단계가 제공돼요.',
        },
        {
          backgroundColor: '#E8FBF9',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding7.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 정보 보기 화면 예시"
            />
          ),
          title: '역 정보 보기',
          subtitle: '엘리베이터·에스컬레이터·화장실·리프트 위치 확인.\n자주 쓰는 역은 즐겨찾기에 추가하세요.',
        },
        {
          backgroundColor: '#F2FFFD',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding8.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="출발역으로 길찾기 화면 예시"
            />
          ),
          title: '출발역으로 길찾기',
          subtitle: '출발역 지정 후, 도착역을 선택하면 경로가 계산돼요.',
        },
        {
          backgroundColor: '#E8FBF9',
          image: (
            <Image
              source={require('./src/assets/onboarding/onboarding9.jpg')}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="도착역으로 길찾기 화면 예시"
            />
          ),
          title: '도착역으로 길찾기',
          subtitle: '도착역을 지정하면 최적 경로가 표시됩니다.',
        },
      ]}
    />
  );
}


/* ──────────────────────────────
   Root Component
────────────────────────────── */
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#F9F9F9' },
};

const AppContent = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    NotoSansKR: require("./src/assets/fonts/NotoSansKR-VariableFont_wght.ttf"),
  });

  const [showOnboarding, setShowOnboarding] = React.useState(true);

  if (isAuthLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <RootStack.Screen name="Onboarding">
            {() => <InlineOnboarding onFinish={() => setShowOnboarding(false)} />}
          </RootStack.Screen>
        ) : user ? (
          <RootStack.Screen name="UserTabs" component={UserTabs} />
        ) : (
          <RootStack.Screen name="AuthScreens" component={AuthStackNavigator} />
        )}
        <RootStack.Screen name="PathFinderStack" component={PathFinderStackNavigator} options={{ headerShown: false }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) GoogleSignin.configure({ webClientId });
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <StatusBar style="dark" backgroundColor="#F9F9F9" />
      <AuthProvider>
        <FontSizeProvider>
          <AppContent />
        </FontSizeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
