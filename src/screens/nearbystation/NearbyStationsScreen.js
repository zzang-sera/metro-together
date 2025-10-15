// src/screens/nearbystation/NearbyStationsScreen.js

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

import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';

const stationData = stationJson.DATA;
const lineData = lineJson.DATA;

/** 좌표 보정: 데이터 키가 파일마다 다를 수 있어 안전하게 가져오기 */
function extractLatLng(station) {
  // 선호: lat/lng → 없으면 Y/X → 없으면 y/x
  const lat = station.lat ?? station.Lat ?? station.latitude ?? station.Y ?? station.y;
  const lng = station.lng ?? station.Lng ?? station.longitude ?? station.X ?? station.x;
  return { lat: Number(lat), lng: Number(lng) };
}

/** 역 코드 보정 */
function extractStationCode(station) {
  return String(
    station.station_cd ??
    station.STN_CD ??
    station.code ??
    station.stationCode ??
    ''
  ).trim();
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
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

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

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

        const stationsWithDistance = stationData.map((station) => {
          const { lat, lng } = extractLatLng(station);
          const dist = (Number.isFinite(lat) && Number.isFinite(lng))
            ? getDistance(latitude, longitude, lat, lng)
            : Number.POSITIVE_INFINITY;
          return { ...station, distance: dist };
        });

        const sortedStations = stationsWithDistance.sort((a, b) => a.distance - b.distance);
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
    const stationCode = extractStationCode(item);
    const stationName = item.name;

    const accessibilityLabel = `${item.line} ${stationName}, ${distanceKm}킬로미터 거리`;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.stationCard}
        accessibilityLabel={accessibilityLabel}
        onPress={() =>
          navigation.navigate('StationDetail', {
            stationCode,
            stationName,
            line: item.line,
            distanceKm,
          })
        }
        // ✅ 길게 누르면 바로 “편의시설 그리드” 화면으로 이동
        onLongPress={() =>
          navigation.navigate('StationFacilities', {
            stationCode,
            stationName,
            line: item.line,
          })
        }
        delayLongPress={250}
      >
        <View style={styles.leftContent}>
          <View style={[styles.lineBadge, { backgroundColor: lineColor }]}>
            <Text
              style={[
                styles.lineBadgeText,
                { color: textColor, fontSize: responsiveFontSize(14) + fontOffset },
              ]}
            >
              {item.line}
            </Text>
          </View>
          <View>
            <Text
              style={[
                styles.stationName,
                { fontSize: responsiveFontSize(18) + fontOffset },
              ]}
            >
              {stationName}
            </Text>
            <Text
              style={[
                styles.distanceText,
                { fontSize: responsiveFontSize(15) + fontOffset },
              ]}
            >
              {distanceKm} km
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={30} color="#595959" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={nearbyStations}
        keyExtractor={(item) =>
          `${extractStationCode(item)}-${item.line}`
        }
        contentContainerStyle={{ paddingHorizontal: responsiveWidth(16) }}
        renderItem={renderStationItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: responsiveFontSize(16),
    color: '#333',
    fontWeight: '700',
  },
  errorText: {
    fontSize: responsiveFontSize(16),
    color: '#D32F2F',
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#17171B',
    textAlign: 'center',
    marginVertical: responsiveHeight(20),
  },
  stationCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveWidth(16),
    marginVertical: responsiveHeight(6),
    borderRadius: responsiveWidth(40),
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineBadge: {
    borderRadius: responsiveWidth(40),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveWidth(12),
  },
  lineBadgeText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
  },
  stationName: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#17171B',
    marginBottom: responsiveHeight(2),
  },
  distanceText: {
    fontSize: responsiveFontSize(15),
    fontWeight: '700',
    color: '#595959',
  },
});

export default NearbyStationsScreen;
