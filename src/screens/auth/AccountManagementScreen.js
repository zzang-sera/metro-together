import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount } from '../../api/auth';
import { deleteUserInfo } from '../../api/user';
import { TERMS_OF_SERVICE, LOCATION_POLICY, PRIVACY_POLICY } from '../../constants/policies';
import { useFontSize } from '../../contexts/FontSizeContext';

const AccountManagementScreen = ({ navigation }) => {
  const { fontOffset } = useFontSize();
  const user = auth.currentUser;
  
  const handleDeleteAccount = () => { Alert.alert( "회원 탈퇴", "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.", [ { text: "취소", style: "cancel" }, { text: "확인", onPress: async () => { const uid = auth.currentUser?.uid; if (uid) { const userInfoResult = await deleteUserInfo(uid); if (!userInfoResult.success) { Alert.alert("오류", "회원 정보 삭제 중 문제가 발생했습니다."); return; } const accountResult = await deleteAccount(); if (!accountResult.success) { Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요."); return; } Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다."); } }, style: "destructive" } ] ); };
  
  const goToPolicy = (title, content) => {
    navigation.navigate('Policy', { title, content });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainCard}>
        <View style={styles.greetingCard}>
          <Text style={[styles.greetingText, { fontSize: responsiveFontSize(16) + fontOffset }]}> {user?.email || '사용자'}님 반갑습니다.</Text>
        </View>

        {/* --- ⛔️ [제거] '사용법 다시보기' 버튼 제거 --- */}

        <View style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>약관 및 정책</Text>
          </View>
          <MenuRow text="서비스 이용 약관" onPress={() => goToPolicy('서비스 이용 약관', TERMS_OF_SERVICE)} />
          <MenuRow text="위치기반 서비스 이용약관" onPress={() => goToPolicy('위치기반 서비스 이용약관', LOCATION_POLICY)} />
          <MenuRow text="개인정보 처리방침" onPress={() => goToPolicy('개인정보 처리방침', PRIVACY_POLICY)} isLast={true} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>계정관리</Text>
          </View>
          {/* --- ⛔️ [제거] '로그아웃' 메뉴 제거 --- */}
          <MenuRow text="회원탈퇴" onPress={handleDeleteAccount} isDestructive={true} isLast={true} />
        </View>
      </View>
    </ScrollView>
  );
};

const MenuRow = ({ text, onPress, isDestructive = false, isLast = false }) => {
  const { fontOffset } = useFontSize();
  return (
    <TouchableOpacity 
      style={[styles.menuRow, !isLast && styles.menuRowBorder]} 
      onPress={onPress}
    >
      <Text style={[styles.menuRowText, isDestructive && styles.destructiveText, { fontSize: responsiveFontSize(18) + fontOffset }]}>{text}</Text>
      <View accessible={false} style={styles.arrowIconCircle}>
        <Ionicons name="chevron-forward" size={30} color={isDestructive ? '#ff3b30' : '#171B1B'} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  mainCard: {
    backgroundColor: '#E2E6EA',
    borderRadius: responsiveWidth(20),
    margin: responsiveWidth(16),
    padding: responsiveWidth(16),
  },
  greetingCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: responsiveWidth(12),
    padding: responsiveHeight(15),
    alignItems: 'center',
    marginBottom: responsiveHeight(16),
  },
  greetingText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(16),
    color: '#17171B',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: responsiveWidth(16),
    marginTop: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(16),
    paddingBottom: responsiveHeight(4),
  },
  cardTitleContainer: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#14CAC9',
    borderRadius: responsiveWidth(20),
    paddingVertical: responsiveHeight(4),
    paddingHorizontal: responsiveWidth(10),
    marginBottom: responsiveHeight(10),
  },
  cardTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(16),
    color: '#171B1B',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: responsiveHeight(16),
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EA',
  },
  menuRowText: {
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(18),
    color: '#17171B',
  },
  destructiveText: {
    color: '#ff3b30',
  },
  arrowIconCircle: {}, // This style seems empty, kept for structure
});

export default AccountManagementScreen;

