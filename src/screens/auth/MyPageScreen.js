import React from 'react';
import { View, Text, SafeAreaView, Alert, StyleSheet } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { logout, deleteAccount } from '../../api/auth';
import { deleteUserInfo } from '../../api/user';
import { responsiveFontSize } from '../../utils/responsive';
import CustomButton from '../../components/CustomButton';

const MyPageScreen = () => {
  const handleLogout = async () => {
    await logout();
    // App.js의 onAuthStateChanged가 로그아웃을 감지하고 자동으로 WelcomeScreen으로 이동시킵니다.
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "확인", 
          onPress: async () => {
            const uid = auth.currentUser?.uid;
            if (uid) {
              const userInfoResult = await deleteUserInfo(uid);
              if (!userInfoResult.success) {
                Alert.alert("오류", "회원 정보 삭제 중 문제가 발생했습니다.");
                return;
              }
              
              const accountResult = await deleteAccount();
              if (!accountResult.success) {
                Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요.");
                return;
              }
              
              Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.infoText}>로그인 계정</Text>
        <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <CustomButton
          type="outline"
          title="로그아웃"
          onPress={handleLogout}
        />
        <CustomButton
          type="destructive"
          title="회원 탈퇴"
          onPress={handleDeleteAccount}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        justifyContent: 'space-between',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    infoText: {
        fontSize: responsiveFontSize(16),
        fontFamily: 'NotoSansKR',
        fontWeight: '500',
        color: '#6A6A6A',
    },
    emailText: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'NotoSansKR',
        fontWeight: '700',
        color: '#17171B',
        marginTop: 8,
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    }
});

export default MyPageScreen;
