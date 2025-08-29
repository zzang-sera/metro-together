// src/api/auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

//회원가입
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: { code: error.code, message: error.message } };
  }
};

//로그인 함수
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: { code: error.code, message: error.message } };
  }
};

//로그아웃 함수
export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
};
//비밀번호 재설정 함수
export const resetPassword = async (email) => {
  try {
    auth.languageCode = 'ko';
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

//구글 로그인용
export const signInWithGoogle = async (idToken) => {
  try {
    // 1. expo-auth-session에서 얻은 idToken으로 Firebase 인증 자격 증명 만들기
    const credential = GoogleAuthProvider.credential(idToken);
    
    // 2. Firebase에 로그인
    const userCredential = await signInWithCredential(auth, credential);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Firebase Google 로그인 오류:", error);
    return { user: null, error };
  }
};
//회원 탈퇴용
export const deleteAccount = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
      return { success: true };
    }
    throw new Error("User not found");
  } catch (error) {
    // 재인증이 필요한 경우 등 복잡한 오류 처리가 필요할 수 있습니다.
    console.error("Auth 계정 삭제 오류:", error);
    return { success: false, error };
  }
};
