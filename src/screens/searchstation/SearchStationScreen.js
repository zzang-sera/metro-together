// src/screens/searchstation/SearchStationScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity, // ✅ 추가
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // ✅ 추가
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

// 데이터
const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

// 호선 → 색상
function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

const SearchStationScreen = () => {
  const navigation = useNavigation(); // ✅ 추가
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
      {/* 헤더 (탭 헤더를 쓰는 경우 생략해도 됨) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>원하는 역 검색</Text>
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="역 이름을 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <View style={styles.searchButton}>
            <Text style={styles.searchButtonText}>검색</Text>
          </View>
        )}
      </View>

      {/* 검색 결과 */}
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
              onPress={() => {
                // ✅ 부모 스택(RootStack)에 등록된 '시설'로 이동
                const rootNav = navigation.getParent?.() || navigation;
                rootNav.navigate('시설', { stationName: item.name, line: firstLine });
              }}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color="black"
                style={styles.locationIcon}
              />
              <Text style={styles.stationName}>{item.name}</Text>
              <View style={styles.lineContainer}>
                {item.lines.map((line) => (
                  <View
                    key={line}
                    style={[styles.lineCircle, { backgroundColor: getLineColor(line) }]}
                  >
                    <Text style={styles.lineText}>{line.replace('호선', '')}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

// 스타일
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e5e5',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', marginLeft: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f0f0', borderRadius: 20,
    margin: 16, paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, height: 40, fontSize: 16 },
  searchButton: { backgroundColor: '#00B8D4', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 6 },
  searchButtonText: { color: 'white', fontWeight: 'bold' },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  locationIcon: { marginRight: 12 },
  stationName: { flex: 1, fontSize: 16 },
  lineContainer: { flexDirection: 'row' },
  lineCircle: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  lineText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: 'gray' },
});

export default SearchStationScreen;
