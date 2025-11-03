import React, { useState } from 'react';
// 1. ScrollView와 Image를 import 합니다.
import { View, Text, Alert, SafeAreaView, Image, ScrollView } from 'react-native'; 
import { styles } from '../../styles/authStyles';
import { signInWithGoogle } from '../../api/auth';
import CustomButton from '../../components/CustomButton';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import FontSettingModal from '../../components/FontSettingModal';

// 2. ✅ 새로 만든 GoogleLogo를 import 합니다.
import GoogleLogo from '../../components/GoogleLogo'; 

const WelcomeScreen = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { fontOffset } = useFontSize();

  const handleGoogleLogin = async () => {
    const { user, error } = await signInWithGoogle();
    if (error) {
      Alert.alert('로그인 오류', '구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const footerTextContent = "로그인 시\n즐겨찾기, 챗봇 기능을 사용할 수 있습니다.";
  
  return (
    <SafeAreaView style={styles.startContainer}>
      <FontSettingModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1, 
          justifyContent: 'space-between' 
        }}
      >
      {/* 3. ✅ <ScrollView>와 <View> 사이 공백 제거 */}
      <View>
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
            type="feature"
            title="지하철 최단경로"
            onPress={() => navigation.navigate('PathFinderStack')}
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
          
          {/* 4. ✅ "Google로 시작하기" 버튼 수정 */}
          <CustomButton
            type="outline" // 흰색 배경
            onPress={handleGoogleLogin}
            // 5. ✅ 공식 CSS의 색상/배경으로 덮어쓰기
            style={{ 
              borderColor: '#747775',      // 공식 테두리 색
              backgroundColor: '#FFFFFF',  // 공식 배경색
            }} 
          >
            {/* 6. ✅ title 대신 children으로 로고 + 텍스트 전달 */}
            <View style={styles.googleButtonContent}>
              {/* 7. ✅ GoogleLogo 컴포넌트 사용 (텍스트 크기에 맞춰서 로고 크기 조절) */}
              <GoogleLogo size={responsiveFontSize(22) + (fontOffset / 2)} /> 
              <Text style={[
                styles.googleButtonText, // 8. ✅ (authStyles.js에 추가할 스타일)
                { fontSize: responsiveFontSize(16) + fontOffset }
              ]}>
                Google로 시작하기
              </Text>
            </View>
          </CustomButton>

          <Text style={[styles.footerText, { fontSize: responsiveFontSize(12) + fontOffset, marginTop: 15 }]}>
            {footerTextContent}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;