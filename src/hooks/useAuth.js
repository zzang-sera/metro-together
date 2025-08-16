import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../api/firebaseConfig'; // 경로 수정
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// 구글 로그인 설정 (앱 실행 시 한 번만)
GoogleSignin.configure({
  webClientId: '774254715570-7ockgrv8747v0u5mdjuvhhus4ofaie1q.apps.googleusercontent.com',
});

// useAuth 훅 정의
export const useAuth = () => {
  
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(auth, googleCredential);
    } catch (error) {
      console.error(error);
    }
  };

  // 여기에 signOut, 유저 정보 가져오기 등 다른 인증 함수도 추가할 수 있습니다.

  return { signInWithGoogle }; // signInWithGoogle 함수를 반환
};