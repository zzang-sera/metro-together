import { StyleSheet } from 'react-native';
import { widthPercentage, responsiveFontSize } from '../utils/responsive';

export const styles = StyleSheet.create({
  // --- 공용 스타일 ---
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  // --- WelcomeScreen 전용 스타일 ---
  startContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: responsiveFontSize(34),
    color: '#17171B',
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  footerText: {
    textAlign: 'center',
    color: '#17171B',
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    marginTop: 16,
  },

  // --- 로그인/회원가입 등 Form 화면 스타일 ---
  title: {
    fontSize: responsiveFontSize(28),
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    color: '#17171B',
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
    color: '#17171B',
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
  },
  bottomNavSeparator: {
    color: '#1A1E22',
    marginHorizontal: 10,
  },
  
  // --- AuthInput 컴포넌트 스타일 (디자인 개선) ---
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '500',
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(16),
    color: '#17171B',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#1A1E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#14CAC9', 
    borderWidth: 2,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputInner: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    color: '#17171B', 
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
    fontWeight: '500',
    marginTop: 8,
  },
  questionBox: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#1A1E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    color: '#17171B',
  },
  
  // ✨ description 스타일을 추가했습니다.
  description: {
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: '500', // Medium 두께로 너무 무겁지 않게
    color: '#1A1E22', // 기본 검정색으로 가독성 확보
    textAlign: 'center',
    lineHeight: responsiveFontSize(24), // 줄 간격 추가
    marginBottom: 32, // 아래 요소와의 간격
  },
});

