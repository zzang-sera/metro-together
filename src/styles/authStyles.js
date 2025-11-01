import { StyleSheet } from 'react-native';
import { responsiveWidth, responsiveFontSize, responsiveHeight } from '../utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  startContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 0,
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
    paddingHorizontal: 20, 
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#17171B', 
  },
  eyeIcon: {
    paddingHorizontal: 16, 
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
    paddingLeft: 16, 
  },
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

