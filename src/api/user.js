// src/api/user.js
import { db } from '../config/firebaseConfig';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';

/**
 * 회원가입 시 사용자 추가 정보(이름, 생년월일, 질문/답변)를 저장하는 함수
 */
export const saveUserInfo = async (uid, email, name, dob, question, answer) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      name,
      dob, // Date of Birth (생년월일)
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
 * 이름, 생년월일, 답변으로 사용자를 찾아 이메일을 반환하는 함수
 */
export const findUserByInfo = async (name, dob, answer) => {
  try {
    const usersRef = collection(db, 'users');
    // ✨ 이름, 생년월일, 답변이 모두 일치하는 사용자를 찾는 쿼리
    const q = query(
      usersRef,
      where('name', '==', name),
      where('dob', '==', dob),
      where('securityAnswer', '==', answer)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { email: null, error: 'NOT_FOUND' };
    }
    
    const userData = querySnapshot.docs[0].data();
    return { email: userData.email, error: null };

  } catch (error) {
    console.error("이메일 찾기 오류:", error);
    return { email: null, error };
  }
};
