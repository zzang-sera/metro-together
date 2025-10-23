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
          const baseCircleSize = 24;
          const sizeOffset = fontOffset > 0 ? fontOffset * 0.75 : fontOffset; 
          const dynamicIconSize = Math.max(18, baseIconSize + sizeOffset);

          // --- 👇 [수정] 원 크기 계산 방식을 더 여유있게 변경 ---
          // 원 안의 글자 크기(14) + 글자 증가량 + 상하좌우 여백(약 12)
          const dynamicCircleSize = Math.max(24, responsiveFontSize(14) + fontOffset + 12); 

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.resultItem}
              onPress={() =>
                navigation.navigate('StationDetail', {
                  stationCode,
                  stationName: item.name,
                  line: firstLine,
                })
              }
              onLongPress={() =>
                navigation.navigate('StationFacilities', {
                  stationCode,
                  stationName: item.name,
                  line: firstLine,
                  type: 'elevator', 
                })
              }
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

              <View style={styles.lineContainer}>
                {item.lines.map((line) => (
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e5e5',
  },
  headerTitle: { 
    fontSize: responsiveFontSize(18), 
    fontWeight: 'bold', 
    marginLeft: 16,
    fontFamily: 'NotoSansKR',
  },
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
  },
  locationIcon: { marginRight: 12 },
  stationName: { 
    flex: 1, 
    fontSize: responsiveFontSize(18),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
  },
  lineContainer: { flexDirection: 'row' },
  lineCircle: {
    // width, height, borderRadius는 인라인 스타일로 동적 적용
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
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

