import { StyleSheet } from 'react-native';
import { widthPercentage, responsiveFontSize } from '../utils/responsive';

export const styles = StyleSheet.create({
  // --- WelcomeScreen.js Styles (Responsive & Variable Font Applied) ---
  startContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '500', // Medium
    textAlign: 'center',
    lineHeight: responsiveFontSize(34),
    color: '#333',
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    width: widthPercentage(300),
    height: widthPercentage(60),
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  outlineButtonText: {
    color: '#424242',
    fontSize: responsiveFontSize(22),
    fontFamily: 'NotoSansKR',
    fontWeight: '500', // Medium
  },
  footerText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: responsiveFontSize(14),
    fontFamily: 'NotoSansKR',
    fontWeight: '400', // Regular
    marginTop: 16,
  },
});

