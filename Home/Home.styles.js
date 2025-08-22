import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5', // 배경색
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center', // 컴포넌트들을 중앙에 가깝게 배치
  },
  card: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 40,
    // 그림자 효과 (선택 사항)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#007AFF', // 버튼 테두리 색상
  },
  buttonText: {
    color: '#007AFF', // 버튼 텍스트 색상
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#007AFF', // 로그인 버튼 배경색
  },
  loginButtonText: {
    color: 'white', // 로그인 버튼 텍스트 색상
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    marginTop: 10,
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  },
});