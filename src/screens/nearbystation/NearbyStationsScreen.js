import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
} from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';

const stationData = stationJson.DATA;
const lineData = lineJson.DATA;

// 📍 두 좌표 거리 계산 함수
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🚇 노선별 색상 반환
function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

// ⚪ 배경 대비 텍스트 색상
function getTextColorForBackground(hexColor) {
  if (!hexColor) return '#FFFFFF';
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#17171B' : '#FFFFFF';
}

const NearbyStationsScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const [nearbyStations, setNearbyStations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 정보 접근 권한이 거부되었습니다.');
        setIsLoading(false);
        return;
      }
      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;
        const stationsWithDistance = stationData.map((station) => ({
          ...station,
          distance: getDistance(latitude, longitude, station.lat, station.lng),
        }));
        const sortedStations = stationsWithDistance.sort(
          (a, b) => a.distance - b.distance
        );
        setNearbyStations(sortedStations.slice(0, 10));
      } catch (error) {
        setErrorMsg('현재 위치를 가져오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          주변 역을 찾고 있습니다...
        </Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          {errorMsg}
        </Text>
      </View>
    );
  }

  const renderStationItem = ({ item }) => {
    const lineColor = getLineColor(item.line);
    const textColor = getTextColorForBackground(lineColor);
    const distanceKm = Number(item.distance || 0).toFixed(1);
    const stationCode = String(item.station_cd ?? item.STN_CD ?? item.code ?? item.stationCode ?? '').trim();
    const stationName = item.name;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.stationCard}
        onPress={() =>
          navigation.navigate('MainStack', {
            screen: 'StationDetail',
            params: { stationCode, stationName, line: item.line, distanceKm },
          })
        }
      >
        <View style={styles.leftContent}>
          <View style={[styles.lineBadge, { backgroundColor: lineColor }]}>
            <Text style={[styles.lineBadgeText, { color: textColor }]}>
              {item.line}
            </Text>
          </View>
          <View>
            <Text style={[styles.stationName, { fontSize: responsiveFontSize(18) + fontOffset }]}>{stationName}</Text>
            <Text style={[styles.distanceText, { fontSize: responsiveFontSize(15) + fontOffset }]}>{distanceKm} km</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MainStack', {
                screen: 'BarrierFreeMap',
                params: { stationName, line: item.line, lat: item.lat, lng: item.lng },
              })
            }
            style={styles.mapIconButton}
          >
            <Ionicons name="navigate-circle-outline" size={28} color="#14CAC9" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={28} color="#595959" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={nearbyStations}
        keyExtractor={(item) => `${item.station_cd}-${item.line}`}
        contentContainerStyle={{ paddingHorizontal: responsiveWidth(16) }}
        renderItem={renderStationItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontWeight: '700', color: '#333' },
  errorText: { fontWeight: '700', color: '#D32F2F', textAlign: 'center' },
  stationCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveWidth(16),
    marginVertical: responsiveHeight(6),
    borderRadius: responsiveWidth(40),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  lineBadge: {
    borderRadius: 40,
    paddingHorizontal: 12,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lineBadgeText: { fontWeight: '700' },
  stationName: { fontWeight: '700', color: '#17171B' },
  distanceText: { fontWeight: '700', color: '#595959' },
  mapIconButton: { backgroundColor: '#E6FAF9', padding: 6, borderRadius: 50 },
});

export default NearbyStationsScreen;
