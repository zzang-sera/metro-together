// App.js
import React, { useEffect } from "react";
import { View, ActivityIndicator, Alert, Image } from "react-native";
import { NavigationContainer, DefaultTheme, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { FontSizeProvider, useFontSize } from "./src/contexts/FontSizeContext";
import { responsiveFontSize } from "./src/utils/responsive";

// --- Screens ---
import WelcomeScreen from "./src/screens/auth/WelcomeScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import FindEmailScreen from "./src/screens/auth/FindEmailScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import MainScreen from "./src/screens/main/MainScreen";
import NearbyStationsScreen from "./src/screens/nearbystation/NearbyStationsScreen";
import SearchStationScreen from "./src/screens/searchstation/SearchStationScreen";
import ChatBotScreen from "./src/screens/chatbot/ChatBotScreen";
import StationDetailScreen from "./src/screens/station/StationDetailScreen";
import MyPageScreen from "./src/screens/auth/MyPageScreen"; // ✅ 수정
import AccountManagementScreen from "./src/screens/auth/AccountManagementScreen";
import FavoritesScreen from "./src/screens/favorites/FavoritesScreen";
import PolicyScreen from "./src/screens/policy/PolicyScreen";
import BarrierFreeMapScreen from "./src/screens/station/BarrierFreeMapScreen"; // ✅ 교체 완료

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MyPageStack = createStackNavigator();
const NearbyStack = createStackNavigator();
const SearchStack = createStackNavigator();
const MainStack = createStackNavigator();

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
   MainStack (BarrierFreeMapScreen 등록)
────────────────────────────── */
const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="StationDetail" component={StationDetailScreen} />
    <MainStack.Screen name="BarrierFreeMap" component={BarrierFreeMapScreen} />
  </MainStack.Navigator>
);

/* ──────────────────────────────
   MyPage Stack
────────────────────────────── */
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

/* ──────────────────────────────
   Nearby Stack
────────────────────────────── */
const NearbyStackNavigator = () => {
  const { fontOffset } = useFontSize();
  return (
    <NearbyStack.Navigator
      screenOptions={{
        ...mintHeaderOptions,
        headerTitleStyle: { ...mintHeaderOptions.headerTitleStyle, fontSize: responsiveFontSize(18) + fontOffset },
      }}
    >
      <NearbyStack.Screen name="NearbyHome" component={NearbyStationsScreen} options={{ title: "주변 역 목록" }} />
      <NearbyStack.Screen name="MainStack" component={MainStackNavigator} options={{ headerShown: false }} />
    </NearbyStack.Navigator>
  );
};

/* ──────────────────────────────
   Search Stack
────────────────────────────── */
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

/* ──────────────────────────────
   Guest Tabs (비로그인)
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
        component={MainScreen}
        options={{ title: "홈" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Welcome");
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
              { text: "확인", onPress: () => navigation.navigate("Welcome") },
            ]);
          },
        }}
      />
    </Tab.Navigator>
  );
};

/* ──────────────────────────────
   User Tabs (로그인)
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
      <Tab.Screen name="홈" component={MainScreen} options={{ title: "홈" }} />
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
const AuthStack = () => {
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
   Root Component
────────────────────────────── */
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F9F9F9",
  },
};

const AppContent = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    NotoSansKR: require("./src/assets/fonts/NotoSansKR-VariableFont_wght.ttf"),
  });

  if (isAuthLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <NavigationContainer theme={navTheme}>{user ? <UserTabs /> : <AuthStack />}</NavigationContainer>;
};

export default function App() {
  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) GoogleSignin.configure({ webClientId });
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
      <StatusBar style="dark" backgroundColor="#F9F9F9" />
      <AuthProvider>
        <FontSizeProvider>
          <AppContent />
        </FontSizeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
