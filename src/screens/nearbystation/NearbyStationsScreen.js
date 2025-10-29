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
const BASE_NEARBY_ICON_SIZE = 22;

// 📍 두 좌표 거리 계산
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

// 🚇 노선별 색상
function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

// ⚪ 대비 텍스트 색상
function getTextColorForBackground(hexColor) {
  if (!hexColor) return '#FFFFFF';
  try {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#17171B' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

const NearbyStationsScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const [nearbyStations, setNearbyStations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ 현재 위치로부터 주변역 계산
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

        // 중복 역 통합
        const grouped = {};
        stationsWithDistance.forEach((s) => {
          if (!grouped[s.name]) {
            grouped[s.name] = {
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              lines: s.line ? [s.line] : [],
              distance: s.distance,
              stationCode: String(
                s.station_cd || s.STN_CD || s.code || s.stationCode || ''
              ).trim(),
            };
          } else {
            if (s.line && !grouped[s.name].lines.includes(s.line)) {
              grouped[s.name].lines.push(s.line);
            }
            if (s.distance < grouped[s.name].distance) {
              grouped[s.name].distance = s.distance;
              grouped[s.name].lat = s.lat;
              grouped[s.name].lng = s.lng;
            }
          }
        });

        const sorted = Object.values(grouped).sort(
          (a, b) => a.distance - b.distance
        );
        setNearbyStations(sorted.slice(0, 10));
      } catch (error) {
        console.error('Error fetching location or processing stations:', error);
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
    const distanceKm = Number(item.distance || 0).toFixed(1);

    // ✅ “서울” 데이터 → 출력은 “서울역”
    const realName = item.name;
    const displayName = item.name === '서울' ? '서울역' : item.name;
    const stationCode = item.stationCode;
    const dynamicIconSize = BASE_NEARBY_ICON_SIZE + fontOffset;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.stationCard}
        onPress={() =>
          navigation.navigate('MainStack', {
            screen: 'StationDetail',
            params: {
              stationName: realName, // ✅ 데이터는 “서울”
              lines: item.lines,
              stationCode,
            },
          })
        }
      >
        <View style={styles.leftContent}>
          <View style={styles.lineContainer}>
            {Array.from({ length: Math.ceil(item.lines.length / 2) }).map(
              (_, rowIndex) => {
                const pair = item.lines.slice(rowIndex * 2, rowIndex * 2 + 2);
                return (
                  <View key={`row-${rowIndex}`} style={styles.lineRow}>
                    {pair.map((line) => {
                      const lineColor = getLineColor(line);
                      const textColor = getTextColorForBackground(lineColor);
                      return (
                        <View
                          key={line}
                          style={[
                            styles.lineBadge,
                            {
                              backgroundColor: lineColor,
                              width: dynamicIconSize,
                              height: dynamicIconSize,
                              borderRadius: dynamicIconSize / 2,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.lineBadgeText,
                              {
                                color: textColor,
                                fontSize: 12 + fontOffset,
                              },
                            ]}
                          >
                            {line.replace('호선', '')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              }
            )}
          </View>

          <View>
            <Text
              style={[
                styles.stationName,
                { fontSize: responsiveFontSize(18) + fontOffset },
              ]}
            >
              {displayName} {/* ✅ “서울역” 표시 */}
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MainStack', {
                screen: 'BarrierFreeMap',
                params: {
                  stationName: realName, // ✅ 데이터는 “서울”
                  lines: item.lines,
                  lat: item.lat,
                  lng: item.lng,
                },
              })
            }
            style={styles.mapIconButton}
          >
            <Ionicons name="navigate-circle-outline" size={28 + fontOffset} color="#14CAC9" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={28 + fontOffset} color="#595959" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={nearbyStations}
        keyExtractor={(item) => `${item.name}-${item.lines.join('-')}`}
        contentContainerStyle={{
          paddingHorizontal: responsiveWidth(16),
          paddingTop: responsiveHeight(10),
        }}
        renderItem={renderStationItem}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.errorText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
              주변에 지하철역 정보가 없습니다.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontWeight: '700', color: '#333' },
  errorText: { fontWeight: '700', color: '#595959', textAlign: 'center' },
  stationCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveWidth(16),
    marginVertical: responsiveHeight(6),
    borderRadius: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  lineContainer: { flexDirection: 'column', marginRight: 12, gap: 6, alignItems: 'flex-start' },
  lineRow: { flexDirection: 'row', gap: 6 },
  lineBadge: { justifyContent: 'center', alignItems: 'center' },
  lineBadgeText: { fontWeight: '700' },
  stationName: { fontWeight: '700', color: '#17171B' },
  distanceText: { fontWeight: '700', color: '#595959', marginTop: 2 },
  mapIconButton: { backgroundColor: '#E6FAF9', padding: 6, borderRadius: 50 },
});

export default NearbyStationsScreen;
