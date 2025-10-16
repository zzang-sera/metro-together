import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig'; 

import { Ionicons } from '@expo/vector-icons'; // [수정] 빠뜨렸던 import 구문 추가
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize } from '../../utils/responsive';
import allStationsData from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineData from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

// 호선 색상을 가져오는 함수
function getLineColor(lineNum) {
  const lineInfo = lineData.DATA.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#A8A8A8';
}

const FavoritesScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); 

  const [favoriteStations, setFavoriteStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setFavoriteStations([]);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      setIsLoading(true);
      if (docSnap.exists()) {
        const favoriteCodes = docSnap.data().favorites || [];
        const stationDetails = allStationsData.DATA
          .filter(station => favoriteCodes.includes(String(station.station_cd ?? station.code)))
          .map(station => ({ 
            stationCode: String(station.station_cd ?? station.code),
            stationName: station.name,
            line: station.line,
            lineColor: getLineColor(station.line),
          }));
        setFavoriteStations(stationDetails);
      } else {
        setFavoriteStations([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("즐겨찾기 로딩 실패:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);


  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#003F40" /></View>;
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={[styles.infoText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          로그인 후 자주 가는 역을 추가해보세요.
        </Text>
      </View>
    );
  }

  if (favoriteStations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.infoText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          역 상세 화면에서 {'\n'}★ 아이콘을 눌러 즐겨찾기를 추가할 수 있습니다.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favoriteStations}
      keyExtractor={(item) => item.stationCode + item.line}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StationDetail', { 
            stationCode: item.stationCode,
            stationName: item.stationName,
            line: item.line,
          })}
        >
          <View style={[styles.lineBadge, { backgroundColor: item.lineColor }]}>
             <Text style={styles.lineText}>{item.line.replace('호선','')}</Text>
          </View>
          <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            {item.stationName}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#A8A8A8" style={styles.chevronIcon} />
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  lineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    height: 28,
  },
  lineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: responsiveFontSize(12),
  },
  buttonText: {
    fontFamily: 'NotoSansKR-Bold',
    color: '#333',
    flex: 1, 
  },
  infoText: {
    fontFamily: 'NotoSansKR-Medium',
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  chevronIcon: {
    marginLeft: 10,
  }
});

export default FavoritesScreen;