// src/firebase/config.js
import Constants from "expo-constants";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = Constants.expoConfig.extra.firebase;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app) ?? initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };
