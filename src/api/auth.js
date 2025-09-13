import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebaseConfig';

/**
 * 이메일과 비밀번호로 새로운 사용자를 생성합니다. (회원가입)
 */
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * 이메일과 비밀번호로 사용자를 로그인시킵니다.
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Google 계정을 사용하여 사용자를 로그인시킵니다. (개발 빌드용)
 */
export const signInWithGoogle = async () => {
  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!webClientId) {
      throw new Error("Google Web Client ID가 설정되지 않았습니다.");
    }

    GoogleSignin.configure({ webClientId });
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    const idToken = userInfo.data.idToken;
    if (!idToken) {
      throw new Error("Google로부터 유효한 idToken을 받지 못했습니다.");
    }
    
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Google 로그인 최종 오류:', error);
    return { user: null, error };
  }
};

/**
 * 현재 로그인된 사용자를 로그아웃시킵니다.
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * 비밀번호 재설정 이메일을 발송합니다.
 */
export const resetPassword = async (email) => {
  try {
    auth.languageCode = 'ko'; // 이메일을 한국어로 보내도록 설정
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * 현재 로그인된 사용자의 계정을 삭제합니다.
 */
export const deleteAccount = async () => {
    try {
        const user = auth.currentUser;
        if (user) {
            const isGoogleUser = user.providerData.some(
              (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
            );

            if (isGoogleUser) {
              await GoogleSignin.revokeAccess();
              await GoogleSignin.signOut();
            }

            await deleteUser(user);
            return { success: true, error: null };
        }
        throw new Error("사용자 정보를 찾을 수 없습니다.");
    } catch (error) {
        console.error("계정 삭제 오류:", error);
        return { success: false, error };
    }
};
