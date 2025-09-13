// src/screens/main/MainScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { logout, deleteAccount } from '../../api/auth';
import { deleteUserInfo } from '../../api/user';
import { styles } from '../../styles/authStyles';

const MainScreen = () => {
  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel"
        },
        { 
          text: "확인", 
          onPress: async () => {
            const uid = auth.currentUser?.uid;
            if (uid) {
              // --- 1. Firestore에서 추가 정보 먼저 삭제 ---
              const userInfoResult = await deleteUserInfo(uid);
              if (!userInfoResult.success) {
                // Firestore 삭제 실패 시 여기서 중단하고 오류 표시
                console.error("Firestore 정보 삭제 실패:", userInfoResult.error);
                Alert.alert("오류", "회원 정보(이름, 생년월일 등) 삭제 중 문제가 발생했습니다.");
                return; // 여기서 함수 종료
              }

              // --- 2. Firebase Auth에서 계정 삭제 ---
              const accountResult = await deleteAccount();
              if (!accountResult.success) {
                // Auth 계정 삭제 실패 시 오류 표시
                console.error("Auth 계정 삭제 실패:", accountResult.error);
                Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요.");
                return; // 여기서 함수 종료
              }

              // --- 모든 과정 성공 ---
              Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.startContainer}>
      <Text style={styles.title}>
        {auth.currentUser?.email}님,{"\n"}환영합니다!
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.deleteButton]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.buttonText}>회원 탈퇴</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MainScreen;
