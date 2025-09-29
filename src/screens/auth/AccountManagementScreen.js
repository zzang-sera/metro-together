// src/screens/auth/AccountManagementScreen.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { responsiveWidth, responsiveHeight } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { logout, deleteAccount } from '../../api/auth';
import { deleteUserInfo } from '../../api/user';
import CustomButton from '../../components/CustomButton';

const AccountManagementScreen = () => {
  const user = auth.currentUser;
  
  const handleLogout = async () => { Alert.alert( "로그아웃", "정말 로그아웃 하시겠습니까?", [ { text: "취소", style: "cancel" }, { text: "확인", onPress: async () => await logout() } ] ); };
  const handleDeleteAccount = () => { Alert.alert( "회원 탈퇴", "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.", [ { text: "취소", style: "cancel" }, { text: "확인", onPress: async () => { const uid = auth.currentUser?.uid; if (uid) { const userInfoResult = await deleteUserInfo(uid); if (!userInfoResult.success) { Alert.alert("오류", "회원 정보 삭제 중 문제가 발생했습니다."); return; } const accountResult = await deleteAccount(); if (!accountResult.success) { Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요."); return; } Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다."); } }, style: "destructive" } ] ); };
  const handleNotReady = () => { Alert.alert("알림", "현재 개발 중인 기능입니다."); };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.greetingText}>{user?.email || '사용자'}님 반갑습니다.</Text>
      </View>

      <CustomButton
        title="사용법 다시보기"
        onPress={handleNotReady}
        type="outline"
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>약관 및 정책</Text>
        <MenuRow text="서비스 이용 약관" onPress={handleNotReady} />
        <MenuRow text="위치기반 서비스 이용약관" onPress={handleNotReady} />
        <MenuRow text="개인정보 처리방침" onPress={handleNotReady} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>계정관리</Text>
        <MenuRow text="로그아웃" onPress={handleLogout} />
        <MenuRow text="회원탈퇴" onPress={handleDeleteAccount} isDestructive={true} />
      </View>
    </ScrollView>
  );
};

const MenuRow = ({ text, onPress, isDestructive = false }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress}>
    <Text style={[styles.menuRowText, isDestructive && styles.destructiveText]}>{text}</Text>
    <Ionicons name="chevron-forward" size={20} color={isDestructive ? '#ff3b30' : '#BDBDBD'} style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: responsiveHeight(20),
    paddingHorizontal: responsiveWidth(16),
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: responsiveWidth(40),
    padding: responsiveWidth(20),
    marginTop: responsiveHeight(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  greetingText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveWidth(16),
    fontWeight: '700',
    color: '#17171B',
  },
  cardTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveWidth(13),
    color: '#888',
    marginBottom: responsiveHeight(10),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveHeight(15),
  },
  menuRowText: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveWidth(16),
    color: '#17171B',
  },
  destructiveText: {
    fontWeight: '700',
    color: '#ff3b30',
  },
});

export default AccountManagementScreen;