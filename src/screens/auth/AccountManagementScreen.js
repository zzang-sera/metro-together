//src/screens/auth/AccountManagementScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive'; // 1. responsiveFontSize 추가
import { Ionicons } from '@expo/vector-icons';
import { logout, deleteAccount } from '../../api/auth';
import { deleteUserInfo } from '../../api/user';
import CustomButton from '../../components/CustomButton';
import { TERMS_OF_SERVICE, LOCATION_POLICY, PRIVACY_POLICY } from '../../constants/policies';

// 2. 필요한 훅 추가
import { useFontSize } from '../../contexts/FontSizeContext';

const AccountManagementScreen = ({ navigation }) => {
  // 3. Context에서 fontOffset 값 가져오기
  const { fontOffset } = useFontSize();
  const user = auth.currentUser;
  
  const handleLogout = async () => { Alert.alert( "로그아웃", "정말 로그아웃 하시겠습니까?", [ { text: "취소", style: "cancel" }, { text: "확인", onPress: async () => await logout() } ] ); };
  const handleDeleteAccount = () => { Alert.alert( "회원 탈퇴", "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.", [ { text: "취소", style: "cancel" }, { text: "확인", onPress: async () => { const uid = auth.currentUser?.uid; if (uid) { const userInfoResult = await deleteUserInfo(uid); if (!userInfoResult.success) { Alert.alert("오류", "회원 정보 삭제 중 문제가 발생했습니다."); return; } const accountResult = await deleteAccount(); if (!accountResult.success) { Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다. 다시 로그인 후 시도해주세요."); return; } Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다."); } }, style: "destructive" } ] ); };
  
  const goToPolicy = (title, content) => {
    navigation.navigate('Policy', { title, content });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainCard}>
        <View style={styles.greetingCard}>
          {/* 4. 동적 폰트 크기 적용 */}
          <Text style={[styles.greetingText, { fontSize: responsiveFontSize(16) + fontOffset }]}> {user?.email || '사용자'}님 반갑습니다.</Text>
        </View>

        <CustomButton
          title="사용법 다시보기"
          onPress={() => Alert.alert("알림", "현재 개발 중인 기능입니다.")}
          type="outline"
        />

        <View style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            {/* 4. 동적 폰트 크기 적용 */}
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>약관 및 정책</Text>
          </View>
          <MenuRow text="서비스 이용 약관" onPress={() => goToPolicy('서비스 이용 약관', TERMS_OF_SERVICE)} accessibilityLabel="서비스 이용 약관 페이지로 이동" />
          <MenuRow text="위치기반 서비스 이용약관" onPress={() => goToPolicy('위치기반 서비스 이용약관', LOCATION_POLICY)} accessibilityLabel="위치기반 서비스 이용약관 페이지로 이동" />
          <MenuRow text="개인정보 처리방침" onPress={() => goToPolicy('개인정보 처리방침', PRIVACY_POLICY)} isLast={true} accessibilityLabel="개인정보 처리방침 페이지로 이동" />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            {/* 4. 동적 폰트 크기 적용 */}
            <Text style={[styles.cardTitle, { fontSize: responsiveFontSize(16) + fontOffset }]}>계정관리</Text>
          </View>
          <MenuRow text="로그아웃" onPress={handleLogout} accessibilityLabel="로그아웃" />
          <MenuRow text="회원탈퇴" onPress={handleDeleteAccount} isDestructive={true} isLast={true} accessibilityLabel="회원탈퇴" />
        </View>
      </View>
    </ScrollView>
  );
};

const MenuRow = ({ text, onPress, isDestructive = false, isLast = false, accessibilityLabel }) => {
  // 5. MenuRow 컴포넌트 내부에서도 Context 훅 사용
  const { fontOffset } = useFontSize();

  return (
    <TouchableOpacity 
      style={[styles.menuRow, !isLast && styles.menuRowBorder]} 
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      {/* 6. 동적 폰트 크기 적용 */}
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
    // 7. responsiveWidth -> responsiveFontSize 로 수정 (코드 정확성 향상)
    fontSize: responsiveFontSize(16), 
    color: '#17171B',
    fontWeight: '700',
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
    fontWeight: '700',
    // 7. responsiveWidth -> responsiveFontSize 로 수정 (코드 정확성 향상)
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
    fontWeight: '700',
    // 7. responsiveWidth -> responsiveFontSize 로 수정 (코드 정확성 향상)
    fontSize: responsiveFontSize(18),
    color: '#17171B',
  },
  destructiveText: {
    color: '#ff3b30',
  },
});

export default AccountManagementScreen;
