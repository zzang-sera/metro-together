
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
import { Ionicons } from '@expo/vector-icons';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
} from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';

const lineData = lineJson.DATA;

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

const dummyStations = [
  {
    name: '서울',
    lat: 37.554648,
    lng: 126.970607,
    lines: ['1호선', '4호선', '공항철도'],
    distance: 0.3,
  },
  {
    name: '고속터미널',
    lat: 37.504697,
    lng: 127.004613,
    lines: ['3호선', '7호선', '9호선'],
    distance: 2.1,
  },
  {
    name: '시청',
    lat: 37.565882,
    lng: 126.975292,
    lines: ['1호선', '2호선'],
    distance: 1.0,
  },
  {
    name: '종로3가',
    lat: 37.571607,
    lng: 126.991806,
    lines: ['1호선', '3호선', '5호선'],
    distance: 1.6,
  },
  {
    name: '을지로3가',
    lat: 37.566295,
    lng: 126.991773,
    lines: ['2호선', '3호선'],
    distance: 1.3,
  },
];

const NearbyStationsScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const [nearbyStations, setNearbyStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setNearbyStations(dummyStations);
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text
          style={[styles.loadingText, { fontSize: responsiveFontSize(16) + fontOffset }]}
        >
          주변 역을 불러오는 중...
        </Text>
      </View>
    );
  }

  const renderStationItem = ({ item }) => {
    const distanceKm = item.distance.toFixed(1);

    const displayName = item.name === '서울' ? '서울역' : item.name;
    const realName = item.name === '서울역' ? '서울' : item.name;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.stationCard}
        onPress={() =>
          navigation.navigate('MainStack', {
            screen: 'StationDetail',
            params: {
              stationName: realName, 
              lines: item.lines,
            },
          })
        }
      >
        <View style={styles.leftContent}>
          <View style={styles.lineContainer}>
            {Array.from({ length: Math.ceil(item.lines.length / 2) }).map((_, rowIndex) => {
              const pair = item.lines.slice(rowIndex * 2, rowIndex * 2 + 2);
              return (
                <View key={`row-${rowIndex}`} style={styles.lineRow}>
                  {pair.map((line) => {
                    const lineColor = getLineColor(line);
                    const textColor = getTextColorForBackground(lineColor);
                    return (
                      <View
                        key={line}
                        style={[styles.lineBadge, { backgroundColor: lineColor }]}
                      >
                        <Text style={[styles.lineBadgeText, { color: textColor }]}>
                          {line.replace('호선', '')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

          <View>
            <Text
              style={[styles.stationName, { fontSize: responsiveFontSize(18) + fontOffset }]}
            >
              {displayName}
            </Text>
            <Text
              style={[styles.distanceText, { fontSize: responsiveFontSize(15) + fontOffset }]}
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
                  stationName: realName, 
                  lines: item.lines,
                  lat: item.lat,
                  lng: item.lng,
                },
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
        keyExtractor={(item) => item.name}
        contentContainerStyle={{
          paddingHorizontal: responsiveWidth(16),
          paddingTop: 10,
        }}
        renderItem={renderStationItem}
        ListHeaderComponent={
          <Text
            style={{
              fontSize: responsiveFontSize(18) + fontOffset,
              fontWeight: 'bold',
              color: '#17171B',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            주변 역 목록 (테스트용)
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontWeight: '700', color: '#333' },
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
  lineContainer: {
    flexDirection: 'column',
    marginRight: 12,
    gap: 6,
    maxWidth: responsiveWidth(120),
  },
  lineRow: {
    flexDirection: 'row',
    gap: 6,
  },
  lineBadge: {
    borderRadius: 40,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineBadgeText: { fontWeight: '700' },
  stationName: { fontWeight: '700', color: '#17171B' },
  distanceText: { fontWeight: '700', color: '#595959' },
  mapIconButton: { backgroundColor: '#E6FAF9', padding: 6, borderRadius: 50 },
});

export default NearbyStationsScreen;
