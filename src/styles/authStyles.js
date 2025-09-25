import { StyleSheet } from 'react-native';
import { widthPercentage, responsiveFontSize } from '../utils/responsive';

export const styles = StyleSheet.create({
  // --- 공용 스타일 ---
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9', // ✨ 배경색 적용
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  // --- WelcomeScreen 전용 스타일 ---
  startContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9', // ✨ 배경색 적용
  },
  header: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: widthPercentage(300),
    height: widthPercentage(100),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  descriptionText: {
    fontSize: responsiveFontSize(24),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: responsiveFontSize(34),
    color: '#17171B', // ✨ 기본 텍스트 색상 적용
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  footerText: {
    textAlign: 'center',
    color: '#17171B', // ✨ 기본 텍스트 색상 적용
    fontSize: responsiveFontSize(14),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    marginTop: 16,
  },

  // --- 로그인/회원가입 등 Form 화면 스타일 ---
  title: {
    fontSize: responsiveFontSize(28),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B', // ✨ 기본 텍스트 색상 적용
    marginBottom: 32,
    textAlign: 'center',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  bottomNavLink: {
    color: '#17171B', // ✨ 기본 텍스트 색상 적용
    fontSize: responsiveFontSize(15),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
  },
  bottomNavSeparator: {
    color: '#1A1E22', // ✨ 기본 검정색 적용
    marginHorizontal: 10,
  },
  
  // --- AuthInput 컴포넌트 스타일 ---
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '700',
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(16),
    color: '#17171B', // ✨ 기본 텍스트 색상 적용
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
  },
  inputFocused: {
    borderColor: '#14CAC9', // ✨ 민트색 적용
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  inputInner: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B', // ✨ 기본 텍스트 색상 적용
  },
  eyeIcon: {
    padding: 12,
  },
  inputError: {
    borderColor: '#C62828',
    borderWidth: 2,
  },
  errorText: {
    color: '#C62828',
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    marginTop: 6,
  },
});

