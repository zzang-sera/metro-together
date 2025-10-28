// src/screens/pathfinder/PathFinderScreen.js
import React, { useState, useMemo, useRef } from 'react';
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
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ionicons 사용 유지
import CustomButton from '../../components/CustomButton';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize, responsiveHeight } from '../../utils/responsive';
import PathResultView from './PathResultView';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
// [수정] MaterialCommunityIcons import 추가 (교환 버튼용)
import { MaterialCommunityIcons } from '@expo/vector-icons';


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
  const [listTopPosition, setListTopPosition] = useState(0);

  const depInputRef = useRef(null);
  const arrInputRef = useRef(null);
  const depRowRef = useRef(null);
  const arrRowRef = useRef(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const matches = allStations.filter((s) => s && s.name && s.name.includes(q));
    const stationMap = new Map();
    matches.forEach((s) => {
      if (stationMap.has(s.name)) stationMap.get(s.name).lines.push(s.line);
      else stationMap.set(s.name, { name: s.name, lines: [s.line] });
    });
    return Array.from(stationMap.values());
  }, [searchQuery]);

  const handleSelectStation = (station) => {
    if (focusedField === 'dep') {
      setDep(station.name);
      arrInputRef.current?.focus();
    } else if (focusedField === 'arr') {
      setArr(station.name);
      Keyboard.dismiss();
    }
    setFocusedField(null);
    setSearchQuery('');
    setPathData(null);
  };

  const swapStations = () => {
    const tempDep = dep;
    setDep(arr);
    setArr(tempDep);
    setPathData(null);
  };

  const handleFindPath = async () => {
    if (!dep.trim() || !arr.trim()) {
      alert('출발역과 도착역을 모두 입력해주세요.');
      return;
    }
    Keyboard.dismiss();
    setPathData(null);
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
      {/* 1. 고정 헤더 */}
      <View style={styles.fixedHeader}>
        <Text style={[styles.title, { fontSize: responsiveFontSize(18) + fontOffset }]}>
          지하철 길찾기
        </Text>

        {pathData === null && (
          <Text style={[styles.subtitle, { fontSize: responsiveFontSize(15) + fontOffset }]}>
            출발역과 도착역을 선택하세요.
          </Text>
        )}

        <View style={styles.searchBoxContainer}>
          <View style={styles.inputWrapper}>
            {/* 출발역 행(Row) */}
            <View ref={depRowRef} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>출발</Text>
              <TextInput
                ref={depInputRef}
                placeholder="출발역 검색"
                style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
                value={dep}
                onFocus={() => {
                  depRowRef.current.measure((fx, fy, width, height, px, py) => {
                    setListTopPosition(py + height - 1);
                    setFocusedField('dep');
                    setSearchQuery(dep);
                  });
                }}
                onChangeText={(text) => {
                  setDep(text);
                  setSearchQuery(text);
                }}
                accessibilityLabel="출발역"
                accessibilityHint="검색할 출발역을 입력하세요"
              />
            </View>

            <View style={styles.divider} />

            {/* 도착역 행(Row) */}
            <View ref={arrRowRef} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { fontSize: responsiveFontSize(16) + fontOffset }]}>도착</Text>
              <TextInput
                ref={arrInputRef}
                placeholder="도착역 검색"
                style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
                value={arr}
                onFocus={() => {
                  arrRowRef.current.measure((fx, fy, width, height, px, py) => {
                    setListTopPosition(py + height - 1);
                    setFocusedField('arr');
                    setSearchQuery(arr);
                  });
                }}
                onChangeText={(text) => {
                  setArr(text);
                  setSearchQuery(text);
                }}
                accessibilityLabel="도착역"
                accessibilityHint="검색할 도착역을 입력하세요"
              />
            </View>
          </View>

          {/* [수정] 교환 버튼 아이콘 및 스타일 변경 */}
          <TouchableOpacity
            onPress={swapStations}
            style={styles.swapButton} // 스타일 이름은 유지
            accessibilityLabel="출발역과 도착역 교환"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="swap-vertical" size={40 + fontOffset} color="#17171B" />
          </TouchableOpacity>
        </View>

        {/* 휠체어 체크박스 */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkboxContainer}
          onPress={() => {
            setWheelchair(!wheelchair);
            setPathData(null);
          }}
          accessibilityLabel="휠체어 이용자입니다"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: wheelchair }}
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

        {!isLoading && pathData === null && (
          <CustomButton type="feature" title="길찾기 시작" onPress={handleFindPath} />
        )}
      </View>

      {/* 2. 경로 결과 (스크롤뷰) */}
      <ScrollView
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!focusedField}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#14CAC9" style={{ marginTop: 40 }} />
        ) : (
          pathData && <PathResultView data={pathData} />
        )}
      </ScrollView>

      {/* 3. 검색 리스트 (오버레이) */}
      {focusedField && searchResults.length > 0 && listTopPosition > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.name}
          keyboardShouldPersistTaps="handled"
          style={[
            styles.dropdown,
            { top: listTopPosition }
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectStation(item)}
              accessibilityLabel={`${item.name}역. ${item.lines.join(', ')}.`}
              accessibilityRole="button"
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  fixedHeader: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    zIndex: 10,
  },
  title: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    textAlign: 'center', 
    marginBottom: 30, 
  },
  subtitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: 'red',
    textAlign: 'center', 
    marginBottom: 8
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  inputWrapper: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center', // [수정] 2. 레이블과 input 수직 중앙 정렬 유지
    paddingHorizontal: 16,
    paddingVertical: 12, // 필요시 이 값을 미세 조정하여 높이 맞춤
  },
  inputLabel: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B', 
    marginRight: 10,
    transform: [{ translateY: -3 }],
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    // backgroundColor: 'lightblue', // 레이아웃 확인용 임시 배경색
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 16,
  },
  swapButton: {
    padding: 16, // 버튼 영역 확보
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveHeight(1.5),
    marginBottom: responsiveHeight(1.5),
    paddingVertical: 8,
  },
  checkboxText: { marginLeft: 8, color: '#17171B', fontFamily: 'NotoSansKR', fontWeight: '700' },

  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },

  dropdown: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 260,
    paddingVertical: 6,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  stationName: { flex: 1, fontFamily: 'NotoSansKR', fontWeight: '700', color: '#17171B' },
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