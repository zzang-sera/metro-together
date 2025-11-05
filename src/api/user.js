import { doc, setDoc, getDoc, query, where, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const saveUserInfo = async (uid, email, name, dob, question, answer) => {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      name,
      dob, 
      securityQuestion: question,
      securityAnswer: answer,
    });
    return { success: true };
  } catch (error) {
    console.error("사용자 정보 저장 오류:", error);
    return { success: false, error };
  }
};

export const checkAndCreateUserDocument = async (user) => {
  if (!user) return { success: false, error: new Error('유저 정보가 없습니다.') };

  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Google 사용자',
        dob: '', 
        securityQuestion: 'N/A_GOOGLE_USER', 
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


export const findUserByDetails = async (name, dob, answer) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, 
            where("name", "==", name), 
            where("dob", "==", dob),
            where("securityAnswer", "==", answer)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
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

export const deleteUserInfo = async (uid) => {
  try {
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
  } catch (error) {
    console.error("Firestore 정보 삭제 오류:", error);
    return { success: false, error };
  }
};
