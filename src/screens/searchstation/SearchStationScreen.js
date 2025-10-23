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
import { responsiveFontSize, responsiveHeight, responsiveWidth } from '../../utils/responsive';

const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

function findStationCodeBy(name, line) {
  const hit = allStations.find(
    (s) => s?.name === name && s?.line === line
  );
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
        <Ionicons name="search" size={20} color="#17171B" style={styles.searchIcon} />
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

          const baseIconSize = 24;
          const sizeOffset = fontOffset > 0 ? fontOffset * 0.75 : fontOffset;
          const dynamicIconSize = Math.max(18, baseIconSize + sizeOffset);
          const dynamicCircleSize = Math.max(24, responsiveFontSize(14) + fontOffset + 12);

          // 호선 아이콘을 2개의 열(column)으로 나누기
          const column1Lines = item.lines.filter((_, index) => index % 2 === 0); // 짝수 인덱스 (0, 2, ...)
          const column2Lines = item.lines.filter((_, index) => index % 2 !== 0); // 홀수 인덱스 (1, 3, ...)

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.resultItem}
              onPress={() => navigation.navigate('StationDetail', { stationCode, stationName: item.name, line: firstLine })}
              onLongPress={() => navigation.navigate('StationFacilities', { stationCode, stationName: item.name, line: firstLine, type: 'elevator' })}
              delayLongPress={250}
              accessibilityLabel={`${firstLine} ${item.name}`}
            >
              <Ionicons
                name="location-outline"
                size={dynamicIconSize}
                color="black"
                style={styles.locationIcon}
              />
              <Text style={[styles.stationName, { fontSize: responsiveFontSize(18) + fontOffset }]}>
                {item.name}
              </Text>

              {/* lineContainer 안에 2개의 column View 배치 */}
              <View style={styles.lineContainer}>
                {/* 첫 번째 열 */}
                <View style={styles.lineColumn}>
                  {column1Lines.map((line) => (
                    <View
                      key={line}
                      style={[
                        styles.lineCircle,
                        {
                          backgroundColor: getLineColor(line),
                          width: dynamicCircleSize,
                          height: dynamicCircleSize,
                          borderRadius: dynamicCircleSize / 2,
                        }
                      ]}
                    >
                      <Text style={[styles.lineText, { fontSize: responsiveFontSize(14) + fontOffset }]}>
                        {line.replace('호선', '')}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* 두 번째 열 (아이콘이 있을 경우에만 렌더링) */}
                {column2Lines.length > 0 && (
                  <View style={styles.lineColumn}>
                    {column2Lines.map((line) => (
                      <View
                        key={line}
                        style={[
                          styles.lineCircle,
                          {
                            backgroundColor: getLineColor(line),
                            width: dynamicCircleSize,
                            height: dynamicCircleSize,
                            borderRadius: dynamicCircleSize / 2,
                          }
                        ]}
                      >
                        <Text style={[styles.lineText, { fontSize: responsiveFontSize(14) + fontOffset }]}>
                          {line.replace('호선', '')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <Text style={[styles.emptyText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
              검색 결과가 없습니다.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f0f0', borderRadius: 20,
    margin: 16, paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: responsiveHeight(10),
    fontSize: responsiveFontSize(18),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 3, borderBottomColor: '#f0f0f0',
    minHeight: responsiveHeight(60), // 세로 공간 확보
  },
  locationIcon: { marginRight: 8, },
  stationName: {
    flexShrink: 1,
    marginRight: 'auto', // 역 이름이 최대한 공간 차지하고, lineContainer는 오른쪽으로 밀어냄
    fontSize: responsiveFontSize(18),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    // alignSelf: 'flex-start', // 아이콘이 여러 줄일 때 역 이름이 위쪽에 붙도록 함
  },
  lineContainer: {
    flexDirection: 'row', // 세로 컬럼들을 가로로 배치
    alignItems: 'flex-start', // 컬럼들 상단 정렬
  },
  lineColumn: {
    flexDirection: 'column', // 아이콘들을 세로로 배치
    alignItems: 'center',    // 아이콘들 가운데 정렬
    marginLeft: 4,          // 왼쪽 컬럼과의 간격 (첫번째 컬럼은 무시됨)
  },
  lineCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4, // 아이콘 세로 간격
  },
  lineText: {
    color: 'white',
    fontSize: responsiveFontSize(14),
    fontWeight: 'bold',
    fontFamily: 'NotoSansKR',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
  },
});

export default SearchStationScreen;