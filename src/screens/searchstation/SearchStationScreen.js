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
import { responsiveFontSize, responsiveHeight } from '../../utils/responsive';

const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
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
        <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { fontSize: responsiveFontSize(16) + fontOffset }]}
          placeholder="역 이름을 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <View style={styles.searchButton}>
            <Text style={[styles.searchButtonText, { fontSize: responsiveFontSize(14) + fontOffset }]}>검색</Text>
          </View>
        )}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.name}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const firstLine = item.lines[0];
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.resultItem}
              onPress={() =>
                navigation.navigate('시설', { stationName: item.name, line: firstLine })
              }
              onLongPress={() =>
                navigation.navigate('역상세', { stationName: item.name, line: firstLine })
              }
              delayLongPress={250}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color="black"
                style={styles.locationIcon}
              />
              <Text style={[styles.stationName, { fontSize: responsiveFontSize(16) + fontOffset }]}>{item.name}</Text>
              <View style={styles.lineContainer}>
                {item.lines.map((line) => (
                  <View
                    key={line}
                    style={[styles.lineCircle, { backgroundColor: getLineColor(line) }]}
                  >
                    <Text style={[styles.lineText, { fontSize: responsiveFontSize(12) + fontOffset }]}>{line.replace('호선', '')}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <Text style={[styles.emptyText, { fontSize: responsiveFontSize(16) + fontOffset }]}>검색 결과가 없습니다.</Text>
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
  // 👇 [수정] fontFamily와 fontWeight 추가
  input: {
    flex: 1,
    paddingVertical: responsiveHeight(10),
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
  },
  searchButton: { backgroundColor: '#00B8D4', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 4 },
  searchButtonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: responsiveFontSize(14),
    fontFamily: 'NotoSansKR',
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  locationIcon: { marginRight: 12 },
  // 👇 [수정] fontFamily와 fontWeight 추가
  stationName: { 
    flex: 1, 
    fontSize: responsiveFontSize(16),
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
  },
  lineContainer: { flexDirection: 'row' },
  lineCircle: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  lineText: { 
    color: 'white', 
    fontSize: responsiveFontSize(12), 
    fontWeight: 'bold',
    fontFamily: 'NotoSansKR',
  },
  // 👇 [수정] fontFamily와 fontWeight 추가
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

