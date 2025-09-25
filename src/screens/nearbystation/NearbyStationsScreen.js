import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

// stationJson 파일 안의 실제 데이터 배열을 가져옵니다.
const stationData = stationJson.DATA;
// ✨ lineJson 파일 안의 실제 데이터 배열을 가져옵니다.
const lineData = lineJson.DATA;

// 두 지점 사이의 거리를 계산하는 함수
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✨ 새로운 line.json 데이터 구조에 맞춰 호선 색상을 찾는 함수
function getLineColor(lineNum) {
  // lineData 배열에서 line 키 값이 일치하는 항목을 찾습니다.
  const lineInfo = lineData.find(l => l.line === lineNum);
  // 찾은 항목의 'color' 키를 반환하거나, 없으면 기본 회색을 반환합니다.
  return lineInfo ? lineInfo.color : '#666666';
}

const NearbyStationsScreen = () => {
  const [nearbyStations, setNearbyStations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 정보 접근 권한이 거부되었습니다.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});

      const stationsWithTransferInfo = stationData.map(station => {
        const isTransfer = stationData.some(
          s => s.name === station.name && s.line !== station.line
        );
        return { ...station, isTransfer };
      });
      
      const stationsWithDistance = stationsWithTransferInfo.map(station => ({
        ...station,
        distance: getDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          station.lat,
          station.lng
        ),
      }));

      const sortedStations = stationsWithDistance.sort((a, b) => a.distance - b.distance);
      setNearbyStations(sortedStations.slice(0, 10));
    })();
  }, []);

  if (errorMsg) {
    return <View style={styles.container}><Text>{errorMsg}</Text></View>;
  }

  if (nearbyStations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>가까운 역을 찾고 있습니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>가까운 역 목록</Text>
      <FlatList
        data={nearbyStations}
        keyExtractor={(item, index) => `${item.name}-${item.line}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.stationItem}>
            <View style={[styles.lineCircle, { backgroundColor: getLineColor(item.line) }]}>
              <Text style={styles.lineText}>{item.line.replace('호선', '')}</Text>
            </View>
            <View style={styles.stationInfo}>
                <Text style={styles.stationName}>{item.name}</Text>
                {item.isTransfer && <View style={styles.transferBadge}><Text style={styles.transferText}>환승</Text></View>}
            </View>
            <Text style={styles.distanceText}>{item.distance.toFixed(1)}km</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111',
  },
  stationItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  lineCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lineText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  transferBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  transferText: {
    color: '#555',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NearbyStationsScreen;

