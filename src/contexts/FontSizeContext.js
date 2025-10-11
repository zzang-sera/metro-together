// src/contexts/FontSizeContext.js (최종 수정 코드)

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // 1. AuthContext 훅 가져오기
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebaseConfig'; // Firebase auth 인스턴스 가져오기

const FONT_OFFSET_KEY = 'font_offset_anonymous'; // 비로그인 사용자용 키
const defaultFontOffset = 0;

export const FontSizeContext = createContext({
  fontOffset: defaultFontOffset,
  setFontOffset: async (newOffset) => {}, // 이름을 setFontOffset으로 다시 통일
  isLoading: true,
});

export const FontSizeProvider = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth(); // 2. user와 인증 로딩 상태 가져오기
  const [fontOffset, setFontOffsetState] = useState(defaultFontOffset);
  const [isSettingLoading, setIsSettingLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    // 3. 인증 상태 로딩이 끝나면 설정값 로드를 시작
    if (isAuthLoading) {
      return; 
    }
    
    const loadSettings = async () => {
      setIsSettingLoading(true);
      if (user) {
        // --- 로그인 사용자: Firebase에서 불러오기 ---
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().accessibilityProfile?.fontScale !== undefined) {
          setFontOffsetState(userDoc.data().accessibilityProfile.fontScale);
        } else {
          setFontOffsetState(defaultFontOffset);
        }
      } else {
        // --- 비로그인 사용자: AsyncStorage에서 불러오기 ---
        const storedOffset = await AsyncStorage.getItem(FONT_OFFSET_KEY);
        setFontOffsetState(storedOffset !== null ? Number(storedOffset) : defaultFontOffset);
      }
      setIsSettingLoading(false);
    };

    loadSettings();
  }, [user, isAuthLoading]); // user나 인증 로딩 상태가 바뀔 때마다 실행

  const setFontOffset = async (newOffset) => {
    setFontOffsetState(newOffset); // UI 즉시 반영

    if (user) {
      // --- 로그인 사용자: Firebase에 저장 ---
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { accessibilityProfile: { fontScale: newOffset } },
        { merge: true }
      );
    } else {
      // --- 비로그인 사용자: AsyncStorage에 저장 ---
      await AsyncStorage.setItem(FONT_OFFSET_KEY, String(newOffset));
    }
  };

  return (
    <FontSizeContext.Provider value={{ fontOffset, setFontOffset, isLoading: isSettingLoading }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  return useContext(FontSizeContext);
};