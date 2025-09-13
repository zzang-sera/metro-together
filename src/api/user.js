import { doc, setDoc, getDoc, query, where, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * 회원가입 시 사용자의 추가 정보를 Firestore에 저장합니다.
 */
export const saveUserInfo = async (uid, email, name, dob, question, answer) => {
  try {
    // 'users' 컬렉션에 사용자 uid를 문서 ID로 사용하여 정보를 저장합니다.
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      name,
      dob, // 생년월일
      securityQuestion: question,
      securityAnswer: answer,
    });
    return { success: true };
  } catch (error) {
    console.error("사용자 정보 저장 오류:", error);
    return { success: false, error };
  }
};

/**
 * Google 로그인 사용자의 정보가 Firestore에 없으면 새로 생성합니다.
 */
export const checkAndCreateUserDocument = async (user) => {
  if (!user) return { success: false, error: new Error('유저 정보가 없습니다.') };

  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      // 문서가 없으면 구글 프로필의 기본 정보로 문서를 생성합니다.
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Google 사용자',
        dob: '', // 구글에서는 생년월일 정보를 제공하지 않음
        securityQuestion: 'N/A_GOOGLE_USER', // 구글 유저 식별용
        securityAnswer: 'N/A_GOOGLE_USER',
      });
      console.log('새로운 구글 사용자 문서가 Firestore에 생성되었습니다.');
    }
    return { success: true };
  } catch (error) {
    console.error('구글 사용자 문서 확인/생성 오류:', error);
    return { success: false, error };
  }
};


/**
 * 제공된 정보와 일치하는 사용자를 찾아 이메일을 반환합니다.
 */
export const findUserByDetails = async (name, dob, answer) => {
    try {
        const usersRef = collection(db, "users");
        // 이름, 생년월일, 답변이 모두 일치하는 사용자를 찾습니다.
        const q = query(usersRef, 
            where("name", "==", name), 
            where("dob", "==", dob),
            where("securityAnswer", "==", answer)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // 일치하는 사용자가 있으면 첫 번째 사용자의 이메일을 반환합니다.
            const userDoc = querySnapshot.docs[0];
            return { success: true, email: userDoc.data().email };
        } else {
            return { success: false, error: { message: "일치하는 사용자가 없습니다." } };
        }
    } catch (error) {
        console.error("이메일 찾기 오류:", error);
        return { success: false, error };
    }
};

/**
 * Firestore에서 특정 사용자의 정보를 삭제합니다.
 */
export const deleteUserInfo = async (uid) => {
  try {
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
  } catch (error) {
    console.error("Firestore 정보 삭제 오류:", error);
    return { success: false, error };
  }
};
