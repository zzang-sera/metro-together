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
import { useNavigation, useRoute } from '@react-navigation/native';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
import { useFontSize } from '../../contexts/FontSizeContext';
import {
  responsiveFontSize,
  responsiveHeight,
} from '../../utils/responsive';

const allStations = stationJson.DATA;
const lineData = lineJson.DATA;
const BASE_SEARCH_ICON_SIZE = 22;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

function getTextColorForBackground(hexColor) {
  if (!hexColor) return "#FFFFFF";
  try {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#17171B" : "#FFFFFF";
  } catch (e) {
    console.error("Error parsing hex color:", hexColor, e);
    return "#FFFFFF";
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
  const route = useRoute();
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

  const handleSelectStation = (station) => {
    const mode = route.params?.mode;
    if (mode === 'dep') {
      navigation.navigate('PathFinder', { selectedDep: station.name });
    } else if (mode === 'arr') {
      navigation.navigate('PathFinder', { selectedArr: station.name });
    } else {
      // 기본 동작: 역 상세
      const firstLine = station.lines[0];
      const stationCode = findStationCodeBy(station.name, firstLine);
      navigation.navigate('MainStack', {
        screen: 'StationDetail',
        params: {
          stationCode,
          stationName: station.name,
          lines: station.lines,
        },
      });
    }
  };

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
          const dynamicIconSize = BASE_SEARCH_ICON_SIZE + fontOffset;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.resultItem}
              onPress={() => handleSelectStation(item)}
              accessibilityLabel={`${item.lines.join(', ')} ${item.name}`}
            >
              <Ionicons
                name="location-outline"
                size={24 + fontOffset / 2}
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
                          const textColor = getTextColorForBackground(lineColor);
                          return (
                            <View
                              key={line}
                              style={[
                                styles.lineCircle,
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
                                  styles.lineText,
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
    alignItems: 'flex-start',
    gap: 4,
  },
  lineRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  lineCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineText: {
    fontWeight: 'bold',
  },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});

export default SearchStationScreen;
