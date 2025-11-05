import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

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
    
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const newUser = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        authProvider: 'google',
        securityQuestion: null,
        securityAnswer: null,
      };
      await setDoc(userDocRef, newUser);
      console.log("새로운 구글 사용자 정보를 Firestore에 저장했습니다.");
    }    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Google 로그인 최종 오류:', error);
    return { user: null, error };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

export const resetPassword = async (email) => {
  try {
    auth.languageCode = 'ko'; 
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

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