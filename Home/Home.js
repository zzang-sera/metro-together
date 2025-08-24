import React from 'react';
// StyleSheet를 react-native에서 직접 가져오지 않습니다.
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native'; 
// 방금 만든 스타일 파일을 import 합니다.
import { styles } from './Home.styles';

const HomeScreen = ({ navigation }) => {
  const handleNearbyStations = () => {
    alert('가까운 역 안내 기능 구현 예정');
  };

  const handleSearchStation = () => {
    alert('원하는 역 검색 기능 구현 예정');
  };

  const handleLogin = () => {
    alert('로그인/회원가입 기능 구현 예정');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 1. 앱 사용 설명 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Metro Together 앱 사용법 🚇</Text>
          <Text style={styles.cardContent}>
            Metro Together는 교통약자를 위한 지하철역 정보 제공 앱입니다.
            주변 역을 찾고, 역 내 시설 정보를 확인하세요!
          </Text>
        </View>

        {/* 2. 메인 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNearbyStations}>
            <Text style={styles.buttonText}>가까운 역 안내</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleSearchStation}>
            <Text style={styles.buttonText}>원하는 역 검색</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>전화번호로 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* 3. 회원가입 안내 텍스트 */}
        <Text style={styles.infoText}>
          회원가입 시 즐겨찾기 및 챗봇 기능을 사용할 수 있습니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

// StyleSheet.create({...}) 부분이 모두 사라지고 파일이 깔끔해졌습니다.

export default HomeScreen;