import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../hooks/useAuth'; // 우리가 만든 훅 임포트

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth(); // 훅에서 로그인 함수를 가져옴

  const handleLogin = async () => {
    const userCredential = await signInWithGoogle();
    if (userCredential) {
      console.log('로그인 성공!', userCredential.user.displayName);
      // 로그인 성공 후 메인 화면으로 이동하는 로직 추가
    }
  };

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        style={{ width: 192, height: 48 }}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={handleLogin} // 버튼을 누르면 handleLogin 함수 실행
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});