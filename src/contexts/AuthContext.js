// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig'; // 기존 firebase 설정 파일

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged는 로그인/로그아웃 시 자동으로 user 상태를 알려줍니다.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    // 앱이 꺼질 때 감시를 중단합니다.
    return unsubscribe;
  }, []);

  return (
    // user와 로딩 상태를 하위 컴포넌트에 제공합니다.
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 다른 파일에서 user 정보를 쉽게 가져오기 위한 훅
export const useAuth = () => {
  return useContext(AuthContext);
};