// src/contexts/UserTypeContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { USER_TYPES } from "../constants/userType";

const USER_TYPE_KEY = "user_type_anonymous";
const defaultUserType = USER_TYPES.DEFAULT;

export const UserTypeContext = createContext({
  userType: defaultUserType,
  setUserType: async (type) => {},
  isWheelchairUser: false,
  isVisualUser: false,
  isLoading: true,
});

export const UserTypeProvider = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [userType, setUserTypeState] = useState(defaultUserType);
  const [isSettingLoading, setIsSettingLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    if (isAuthLoading) return;

    const loadSettings = async () => {
      setIsSettingLoading(true);
      try {
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          const savedType =
            userDoc.exists() &&
            userDoc.data().accessibilityProfile &&
            userDoc.data().accessibilityProfile.userType;

          if (
            savedType === USER_TYPES.DEFAULT ||
            savedType === USER_TYPES.VISUAL ||
            savedType === USER_TYPES.WHEELCHAIR
          ) {
            setUserTypeState(savedType);
          } else {
            setUserTypeState(defaultUserType);
          }
        } else {
          const stored = await AsyncStorage.getItem(USER_TYPE_KEY);
          if (
            stored === USER_TYPES.DEFAULT ||
            stored === USER_TYPES.VISUAL ||
            stored === USER_TYPES.WHEELCHAIR
          ) {
            setUserTypeState(stored);
          } else {
            setUserTypeState(defaultUserType);
          }
        }
      } catch (e) {
        console.warn("⚠️ 사용자 유형 불러오기 실패:", e);
        setUserTypeState(defaultUserType);
      } finally {
        setIsSettingLoading(false);
      }
    };

    loadSettings();
  }, [user, isAuthLoading]);

  const setUserType = async (type) => {
    setUserTypeState(type);

    try {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(
          userDocRef,
          {
            accessibilityProfile: {
              userType: type,
            },
          },
          { merge: true }
        );
      } else {
        await AsyncStorage.setItem(USER_TYPE_KEY, String(type));
      }
    } catch (e) {
      console.warn("⚠️ 사용자 유형 저장 실패:", e);
    }
  };

  const value = {
    userType,
    setUserType,
    isWheelchairUser: userType === USER_TYPES.WHEELCHAIR,
    isVisualUser: userType === USER_TYPES.VISUAL,
    isLoading: isSettingLoading,
  };

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
};

export const useUserType = () => {
  return useContext(UserTypeContext);
};
