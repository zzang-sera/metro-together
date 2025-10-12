import React, { useState } from 'react';
import { View, Text, Alert, SafeAreaView, Image } from 'react-native';
import { styles } from '../../styles/authStyles';
import { signInWithGoogle } from '../../api/auth';
import CustomButton from '../../components/CustomButton';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import FontSettingModal from '../../components/FontSettingModal';

const WelcomeScreen = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { fontOffset } = useFontSize();

  const handleGoogleLogin = async () => {
    const { user, error } = await signInWithGoogle();
    if (error) {
      Alert.alert('로그인 오류', '구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // --- 👇 [수정] 글자 크기에 따라 줄바꿈 텍스트를 다르게 설정 ---
  const footerTextContent = fontOffset >= 8
    ? "즐겨찾기, 챗봇 기능을\n사용할 수 있습니다."
    : "회원 가입 시\n즐겨찾기, 챗봇 기능을 사용할 수 있습니다.";
  
  return (
    <SafeAreaView style={styles.startContainer}>
      <FontSettingModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <View style={styles.header}>
        <Image 
          source={require('../../../src/assets/brand-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.descriptionText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          모두를 위한 지하철 이용 도우미,{'\n'}함께타요입니다.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          type="feature"
          title="가까운 역 안내"
          onPress={() => navigation.navigate('GuestTabs', { screen: '주변' })}
        />
        <CustomButton
          type="feature"
          title="원하는 역 검색"
          onPress={() => navigation.navigate('GuestTabs', { screen: '검색' })}
        />
        <CustomButton
          type="outline" 
          title="글자 크기 설정"
          onPress={() => setModalVisible(true)}
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
        {/* --- 👇 [수정] 위에서 정의한 조건부 텍스트를 적용 --- */}
        <Text style={[styles.footerText, { fontSize: responsiveFontSize(12) + fontOffset, marginTop: 15 }]}>
          {footerTextContent}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

