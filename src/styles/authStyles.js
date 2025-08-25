// src/styles/authStyles.js
import { StyleSheet } from 'react-native';

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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#17171B',
    marginBottom: 48,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#17171B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    // ✨ 1. 배경색을 약간 더 어둡게 변경하여 흰 배경과 구분되도록 함
    backgroundColor: '#F0F0F0', 
    borderRadius: 8,
    borderWidth: 1.5, // 테두리 두께를 약간 더 두껍게
    // ✨ 2. 테두리 색을 더 진한 회색으로 변경하여 명확하게 보이도록 함
    borderColor: '#BDBDBD', 
  },
   inputFocused: {
    borderColor: '#14CAC9', // 버튼과 동일한 파란색
    borderWidth: 2,
    backgroundColor: '#FFFFFF', // 배경을 흰색으로 바꿔서 더 강조
  },
  inputInner: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#17171B', // 입력하는 글자색도 검은색으로 명확하게
  },
  eyeIcon: {
    padding: 12,
  },
  inputError: {
    // ✨ 3. 오류 시 테두리 색도 더 선명한 빨간색으로 변경
    borderColor: '#C62828', 
    borderWidth: 2, // 오류 시 테두리를 더 두껍게
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    marginTop: 6,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#14CAC9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#17171B',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
