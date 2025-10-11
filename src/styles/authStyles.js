import { StyleSheet } from 'react-native';
import { responsiveWidth, responsiveFontSize, responsiveHeight } from '../utils/responsive';

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
    width: responsiveWidth(300),
    height: responsiveWidth(100),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  descriptionText: {
    fontSize: responsiveFontSize(24),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    marginTop: 16,
  },

  // --- 로그인/회원가입 등 Form 화면 스타일 ---
  title: {
    fontSize: responsiveFontSize(28),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#17171B',
    marginBottom: 32,
    textAlign: 'center',
  },
  bottomNavContainer: {
    flexDirection: 'column', 
    marginTop: 24,
    width: '100%',
  },
  
  // --- AuthInput 컴포넌트 스타일 ---
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(16),
    color: '#17171B',
    marginBottom: 12,
  },
  // --- 👇 [수정] borderRadius를 40으로 변경하여 둥글게 만듭니다 ---
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 40, // 12 -> 40
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
    paddingHorizontal: 20, // 둥근 디자인에 맞게 여백 조정
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#17171B', 
  },
  eyeIcon: {
    paddingHorizontal: 16, // 여백 조정
  },
  inputError: {
    borderColor: '#C62828',
    borderWidth: 2,
  },
  errorText: {
    color: '#C62828',
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    marginTop: 8,
    paddingLeft: 16, // 들여쓰기 추가
  },
  // --- 👇 [수정] questionBox도 동일하게 둥글게 만듭니다 ---
  questionBox: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 40, // 12 -> 40
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 20, // 여백 조정
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
    fontWeight: 'bold',
    color: '#17171B',
  },
  description: {
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#1A1E22',
    textAlign: 'center',
    lineHeight: responsiveFontSize(24),
    marginBottom: 32,
  },
});

