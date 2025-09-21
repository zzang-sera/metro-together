// src/styles/authStyles.js

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#17171B',
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
    borderColor: '#14CAC9',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  inputInner: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 22,
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
    fontSize: 14,
    marginTop: 6,
  },
  questionText: {
    fontSize: 22,
    color: '#495057',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#005EB8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  bottomNavLink: {
    color: '#555555',
    fontSize: 15,
  },
  bottomNavSeparator: {
    color: '#D0D0D0',
    marginHorizontal: 10,
  },

  // --- WelcomeScreen.js 스타일 (비율 기반 레이아웃으로 수정) ---
  startContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ✨ 1. 상단 네비게이션 바 공간
  header: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  // ✨ 로고 이미지 스타일 추가
  logoImage: {
    width: 200,   // 이미지의 너비를 더 키워봅니다. (예: 200)
    height: 60,   // 이미지의 높이를 더 키워봅니다. (예: 60)
  },
  // ✨ 2. 중앙 콘텐츠 (남는 공간을 모두 차지하여 하단 버튼을 밀어냄)
  content: {
    flex: 1, // 이 부분이 핵심입니다.
    justifyContent: 'center', // 세로 중앙 정렬
    paddingHorizontal: 24,
  },
  descriptionText: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 34,
    fontWeight: 'bold', // 폰트 두께 조절
    color: '#333',
  },
  // ✨ 3. 하단 버튼 컨테이너
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40, // 하단 여백
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16, // 패딩 조절
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginBottom: 12, // 버튼 간격 조절
  },
  outlineButtonText: {
    color: '#424242',
    fontSize: 16, // 폰트 크기 조절
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 12, // 폰트 크기 조절
    marginTop: 16,
  },
});