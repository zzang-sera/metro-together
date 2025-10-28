//src/screens/pathfinder/PathFinderScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize, responsiveHeight } from '../../utils/responsive';
import PathResultView from './PathResultView';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

const SUPABASE_URL = 'https://utqfwkhxacqhgjjalpby.supabase.co/functions/v1/pathfinder';
const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

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

const PathFinderScreen = () => {
  const { fontOffset } = useFontSize();

  const [dep, setDep] = useState('');
  const [arr, setArr] = useState('');
  const [wheelchair, setWheelchair] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pathData, setPathData] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const matches = allStations.filter((s) => s.name.includes(q));
    const stationMap = new Map();
    matches.forEach((s) => {
      if (stationMap.has(s.name)) stationMap.get(s.name).lines.push(s.line);
      else stationMap.set(s.name, { name: s.name, lines: [s.line] });
    });
    return Array.from(stationMap.values());
  }, [searchQuery]);

  const handleSelectStation = (station) => {
    if (focusedField === 'dep') setDep(station.name);
    else if (focusedField === 'arr') setArr(station.name);
    setFocusedField(null);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleFindPath = async () => {
    if (!dep.trim() || !arr.trim()) {
      alert('출발역과 도착역을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const url = `${SUPABASE_URL}?dep=${encodeURIComponent(dep)}&arr=${encodeURIComponent(arr)}&wheelchair=${wheelchair}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) alert(data.error);
      else setPathData(data);
    } catch (e) {
      alert('경로를 불러오는 중 문제가 발생했습니다.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 고정 헤더 */}
      <View style={styles.fixedHeader}>
        <Text style={[styles.title, { fontSize: responsiveFontSize(22) + fontOffset }]}>
          교통약자용 이동경로 찾기
        </Text>
        <Text style={[styles.subtitle, { fontSize: responsiveFontSize(15) + fontOffset }]}>
          출발역과 도착역을 검색 후 선택하세요.
        </Text>

        {/* 출발역 */}
        <View style={styles.inputContainer}>
          <Ionicons name="train-outline" size={22 + fontOffset / 2} color="#14CAC9" />
          <TextInput
            placeholder="출발역 검색"
            style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
            value={dep}
            onFocus={() => {
              setFocusedField('dep');
              setSearchQuery(dep);
            }}
            onChangeText={(text) => {
              setDep(text);
              setSearchQuery(text);
            }}
          />
        </View>

        {/* 도착역 */}
        <View style={styles.inputContainer}>
          <Ionicons name="flag-outline" size={22 + fontOffset / 2} color="#14CAC9" />
          <TextInput
            placeholder="도착역 검색"
            style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
            value={arr}
            onFocus={() => {
              setFocusedField('arr');
              setSearchQuery(arr);
            }}
            onChangeText={(text) => {
              setArr(text);
              setSearchQuery(text);
            }}
          />
        </View>

        {/* 휠체어 체크 */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.checkboxContainer, wheelchair && styles.checkboxChecked]}
          onPress={() => setWheelchair(!wheelchair)}
        >
          <Ionicons
            name={wheelchair ? 'checkbox-outline' : 'square-outline'}
            size={26 + fontOffset / 2}
            color={wheelchair ? '#14CAC9' : '#999'}
          />
          <Text style={[styles.checkboxText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            휠체어 이용자입니다
          </Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#14CAC9" style={{ marginTop: 20 }} />
        ) : (
          <CustomButton type="feature" title="길찾기 시작" onPress={handleFindPath} />
        )}
      </View>

      {/* 검색 결과 (FlatList, ScrollView 바깥) */}
      {focusedField && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.name}
          keyboardShouldPersistTaps="handled"
          style={styles.dropdown}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectStation(item)}
            >
              <Ionicons name="location-outline" size={20} color="#17171B" style={{ marginRight: 8 }} />
              <Text style={[styles.stationName, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                {item.name}
              </Text>
              <View style={styles.lineContainer}>
                {item.lines.map((line) => {
                  const color = getLineColor(line);
                  const textColor = getTextColorForBackground(color);
                  return (
                    <View key={line} style={[styles.lineCircle, { backgroundColor: color }]}>
                      <Text style={[styles.lineText, { color: textColor }]}>
                        {line.replace('호선', '')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* 스크롤 영역 (결과) */}
      <ScrollView style={styles.scrollArea}>
        {pathData && <PathResultView data={pathData} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  fixedHeader: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: { fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
  subtitle: { fontFamily: 'NotoSansKR', fontWeight: '500', color: '#595959', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: responsiveHeight(1.5) },
  checkboxText: { marginLeft: 8, color: '#17171B', fontFamily: 'NotoSansKR', fontWeight: '700' },
  scrollArea: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 260,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    paddingVertical: 6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  stationName: { flex: 1, fontFamily: 'NotoSansKR', fontWeight: '700' },
  lineContainer: { flexDirection: 'row', gap: 6 },
  lineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineText: { fontWeight: '700', fontSize: 11 },
});

export default PathFinderScreen;
