// src/firebase/config.js
import Constants from "expo-constants";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// 🔹 Expo app.json → extra.firebase 에서 Firebase 설정 읽기
const firebaseConfig = Constants.expoConfig.extra.firebase;

// 🔹 중복 초기화 방지
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔹 React Native 환경에서 auth persistence 활성화
const auth = getAuth(app) ?? initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// 🔹 Firestore 인스턴스
const db = getFirestore(app);

export { app, auth, db };
