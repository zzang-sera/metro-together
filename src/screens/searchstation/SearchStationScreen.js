import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
import { useFontSize } from '../../contexts/FontSizeContext';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/responsive';

const allStations = stationJson.DATA;
const lineData = lineJson.DATA;
const BASE_SEARCH_ICON_SIZE = 22; // [추가] 검색 결과용 아이콘 기본 크기

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

// [추가] 배경색 대비 텍스트 색상 결정 함수
function getTextColorForBackground(hexColor) {
  if (!hexColor) return "#FFFFFF"; // 기본값 흰색
  try {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#17171B" : "#FFFFFF"; // 밝으면 검은색, 어두우면 흰색
  } catch (e) {
    console.error("Error parsing hex color:", hexColor, e);
    return "#FFFFFF"; // 오류 시 흰색 반환
  }
}


function findStationCodeBy(name, line) {
  const hit = allStations.find((s) => s?.name === name && s?.line === line);
  const code = String(
    hit?.station_cd ?? hit?.STN_CD ?? hit?.code ?? hit?.stationCode ?? ''
  ).trim();
  return code;
}

const SearchStationScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const matchingStations = allStations.filter((station) =>
      station.name.startsWith(q)
    );
    const stationMap = new Map();
    matchingStations.forEach((station) => {
      if (stationMap.has(station.name)) {
        stationMap.get(station.name).lines.push(station.line);
      } else {
        stationMap.set(station.name, { name: station.name, lines: [station.line] });
      }
    });
    return Array.from(stationMap.values());
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20 + fontOffset / 2} color="#17171B" style={styles.searchIcon} /> 
        <TextInput
          style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
          placeholder="역 이름을 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.name}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const firstLine = item.lines[0];
          const stationCode = findStationCodeBy(item.name, firstLine);
          
          // [추가] 동적 아이콘 크기 계산
          const dynamicIconSize = BASE_SEARCH_ICON_SIZE + fontOffset;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.resultItem}
              onPress={() =>
                navigation.navigate('MainStack', {
                  screen: 'StationDetail',
                  params: {
                    stationCode,
                    stationName: item.name,
                    lines: item.lines, 
                  },
                })
              }
              onLongPress={() =>
                navigation.navigate('MainStack', {
                  screen: 'BarrierFreeMap',
                  params: {
                    stationName: item.name,
                    lines: item.lines, 
                  },
                })
              }
              delayLongPress={250}
              accessibilityLabel={`${item.lines.join(', ')} ${item.name}`}
            >
              <Ionicons
                name="location-outline"
                size={24 + fontOffset / 2} // 아이콘 크기도 fontOffset 반영
                color="#17171B"
                style={styles.locationIcon}
              />
              <Text
                style={[
                  styles.stationName,
                  { fontSize: responsiveFontSize(18) + fontOffset },
                ]}
              >
                {item.name}
              </Text>

              <View style={styles.lineContainer}>
                {Array.from({ length: Math.ceil(item.lines.length / 2) }).map(
                  (_, rowIndex) => {
                    const pair = item.lines.slice(rowIndex * 2, rowIndex * 2 + 2);
                    return (
                      <View key={`row-${rowIndex}`} style={styles.lineRow}>
                        {pair.map((line) => {
                          const lineColor = getLineColor(line);
                          const textColor = getTextColorForBackground(lineColor); // [수정] 동적 텍스트 색상
                          
                          return (
                            <View
                              key={line}
                              style={[
                                styles.lineCircle,
                                { 
                                  backgroundColor: lineColor,
                                  // [수정] 동적 크기 적용
                                  width: dynamicIconSize,
                                  height: dynamicIconSize,
                                  borderRadius: dynamicIconSize / 2,
                                },
                              ]}
                            >
                              <Text style={[
                                styles.lineText,
                                { 
                                  color: textColor, // [수정] 동적 색상 적용
                                  fontSize: 12 + fontOffset, // [수정] 동적 폰트 크기
                                }
                              ]}>
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
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <Text
              style={[
                styles.emptyText,
                { fontSize: responsiveFontSize(16) + fontOffset },
              ]}
            >
              검색 결과가 없습니다.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    margin: 16,
    paddingHorizontal: 12,
    // [추가] TextInput 높이가 커질 수 있으므로 최소 높이 지정
    minHeight: responsiveHeight(5.5),
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontWeight: 'bold' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C9CDD1',
  },
  locationIcon: { marginRight: 8 },
  stationName: { flex: 1, fontWeight: 'bold', color: '#17171B' },
  lineContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start', // 오른쪽 정렬 유지
    gap: 4,
  },
  lineRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end', // 오른쪽 정렬 유지
  },
  lineCircle: {
    // [수정] width, height, borderRadius는 JSX에서 동적으로 설정되므로 제거
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineText: { 
    // [수정] color, fontSize는 JSX에서 동적으로 설정되므로 제거
    fontWeight: 'bold', 
  },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});

export default SearchStationScreen;