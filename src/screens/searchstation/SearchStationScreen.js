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

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
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
                    lines: item.lines, // ✅ 다중호선 배열 전달
                  },
                })
              }
              onLongPress={() =>
                navigation.navigate('MainStack', {
                  screen: 'BarrierFreeMap',
                  params: {
                    stationName: item.name,
                    lines: item.lines, // ✅ 지도에도 다중호선 전달
                  },
                })
              }
              delayLongPress={250}
              accessibilityLabel={`${item.lines.join(', ')} ${item.name}`}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color="black"
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

              {/* ✅ 호선 뱃지 2개씩 줄맞춤 */}
              <View style={styles.lineContainer}>
                {Array.from({ length: Math.ceil(item.lines.length / 2) }).map(
                  (_, rowIndex) => {
                    const pair = item.lines.slice(rowIndex * 2, rowIndex * 2 + 2);
                    return (
                      <View key={`row-${rowIndex}`} style={styles.lineRow}>
                        {pair.map((line) => (
                          <View
                            key={line}
                            style={[
                              styles.lineCircle,
                              { backgroundColor: getLineColor(line) },
                            ]}
                          >
                            <Text style={styles.lineText}>
                              {line.replace('호선', '')}
                            </Text>
                          </View>
                        ))}
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
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontWeight: 'bold' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: { marginRight: 8 },
  stationName: { flex: 1, fontWeight: 'bold', color: '#17171B' },
  // ✅ 줄맞춤 (2개씩)
  lineContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  lineRow: {
    flexDirection: 'row',
    gap: 6,
  },
  lineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineText: { color: 'white', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});

export default SearchStationScreen;
