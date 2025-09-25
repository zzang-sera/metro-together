import React from 'react';
import { View, Text, Alert, SafeAreaView, Image } from 'react-native';
import { styles } from '../../styles/authStyles';
import { signInWithGoogle } from '../../api/auth';
import CustomButton from '../../components/CustomButton';

const WelcomeScreen = ({ navigation }) => {
  const handleGoogleLogin = async () => { 
    const { user, error } = await signInWithGoogle();
    if (error) {
      Alert.alert('로그인 오류', '구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };
  const handleFeaturePress = (featureName) => { 
    Alert.alert('알림', `${featureName} 기능은 현재 준비 중입니다.`);
  };

  return (
    <SafeAreaView style={styles.startContainer}>
      <View style={styles.header}>
        <Image 
          source={require('../../../src/assets/brand-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.descriptionText}>
          모두를 위한 지하철 이용 도우미,{'\n'}함께타요입니다.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          type="feature"
          title="가까운 역 안내"
          onPress={() => handleFeaturePress('가까운 역 안내')}
        />
        <CustomButton
          type="feature"
          title="원하는 역 검색"
          onPress={() => handleFeaturePress('원하는 역 검색')}
        />
        <CustomButton
          type="outline"
          title="이메일로 시작하기"
          onPress={() => navigation.navigate('Login')}
        />
        <CustomButton
          type="outline"
          title="Google로 시작하기"
          onPress={handleGoogleLogin}
        />
        <Text style={styles.footerText}>
          회원 가입 시 {'\n'} 즐겨찾기, 챗봇 기능을 사용할 수 있습니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

