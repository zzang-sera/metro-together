// src/contexts/FontSizeContext.js (최종 수정 코드)

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; 
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebaseConfig'; 

const FONT_OFFSET_KEY = 'font_offset_anonymous'; 
const defaultFontOffset = 0;

export const FontSizeContext = createContext({
  fontOffset: defaultFontOffset,
  setFontOffset: async (newOffset) => {}, 
  isLoading: true,
});

export const FontSizeProvider = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth(); 
  const [fontOffset, setFontOffsetState] = useState(defaultFontOffset);
  const [isSettingLoading, setIsSettingLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    if (isAuthLoading) {
      return; 
    }
    
    const loadSettings = async () => {
      setIsSettingLoading(true);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().accessibilityProfile?.fontScale !== undefined) {
          setFontOffsetState(userDoc.data().accessibilityProfile.fontScale);
        } else {
          setFontOffsetState(defaultFontOffset);
        }
      } else {
        const storedOffset = await AsyncStorage.getItem(FONT_OFFSET_KEY);
        setFontOffsetState(storedOffset !== null ? Number(storedOffset) : defaultFontOffset);
      }
      setIsSettingLoading(false);
    };

    loadSettings();
  }, [user, isAuthLoading]); 

  const setFontOffset = async (newOffset) => {
    setFontOffsetState(newOffset); 

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { accessibilityProfile: { fontScale: newOffset } },
        { merge: true }
      );
    } else {
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