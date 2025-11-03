import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize, responsiveHeight } from '../../utils/responsive';
import PathResultView from './PathResultView';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SUPABASE_URL = 'https://utqfwkhxacqhgjjalpby.supabase.co/functions/v1/pathfinder'; 
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

export async function fetchSubwayPath(dep, arr, wheelchair = false) {
  if (!dep?.trim() || !arr?.trim()) {
    throw new Error('출발역과 도착역이 필요합니다.');
  }
  const url = `${SUPABASE_URL}?dep=${encodeURIComponent(dep)}&arr=${encodeURIComponent(arr)}&wheelchair=${wheelchair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

const PathFinderScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const route = useRoute(); // ✅ 추가됨

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

  // ✅ 추가: 다른 화면에서 넘어온 출발/도착역 자동 세팅
  useEffect(() => {
    if (route.params?.selectedDep) {
      setDep(route.params.selectedDep);
    }
    if (route.params?.selectedArr) {
      setArr(route.params.selectedArr);
    }
  }, [route.params]);

  // ✅ “서울” → “서울역” 표시
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const matches = allStations.filter((s) => s && s.name && s.name.includes(q));
    const stationMap = new Map();
    matches.forEach((s) => {
      const displayName = s.name === "서울" ? "서울역" : s.name;
      if (stationMap.has(displayName)) {
        stationMap.get(displayName).lines.push(s.line);
      } else {
        stationMap.set(displayName, { name: displayName, lines: [s.line] });
      }
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
    if (dep.trim() === arr.trim()) {
      alert('출발역과 도착역이 같습니다. 다른 역을 선택해주세요.');
      return;
    }
    Keyboard.dismiss();
    setPathData(null);
    setIsLoading(true);
    try {
      const data = await fetchSubwayPath(dep, arr, wheelchair);
      setPathData(data);
    } catch (e) {
      alert('경로를 불러오는 중 문제가 발생했습니다.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 안내 영역 */}
      <View style={styles.fixedHeader}>
        {pathData === null && (
          <View style={styles.noticeBox} accessibilityRole="alert">
            <Ionicons
              name="information-circle-outline"
              size={responsiveFontSize(24)}
              color="#0B5FFF"
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.noticeText,
                { fontSize: responsiveFontSize(15) + fontOffset },
              ]}
            >
              출발역과 도착역을 선택해주세요.
            </Text>
          </View>
        )}

        {/* 입력창 */}
        <View style={styles.searchBoxContainer}>
          <View style={styles.inputWrapper}>
            {/* 출발역 입력 */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.inputLabel,
                  { fontSize: responsiveFontSize(16) + fontOffset },
                ]}
              >
                출발
              </Text>
              <TextInput
                ref={depInputRef}
                placeholder="출발역 검색"
                style={[
                  styles.input,
                  { fontSize: responsiveFontSize(18) + fontOffset },
                ]}
                value={dep}
                onFocus={() => {
                  depInputRef.current.measure((fx, fy, width, height, px, py) => {
                    const statusBarHeight =
                      Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
                    setListTopPosition(py + height - statusBarHeight);
                    setFocusedField('dep');
                    setSearchQuery(dep);
                  });
                }}
                onChangeText={(text) => {
                  setDep(text);
                  setSearchQuery(text);
                }}
              />
            </View>

            <View style={styles.divider} />

            {/* 도착역 입력 */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.inputLabel,
                  { fontSize: responsiveFontSize(16) + fontOffset },
                ]}
              >
                도착
              </Text>
              <TextInput
                ref={arrInputRef}
                placeholder="도착역 검색"
                style={[
                  styles.input,
                  { fontSize: responsiveFontSize(18) + fontOffset },
                ]}
                value={arr}
                onFocus={() => {
                  arrInputRef.current.measure((fx, fy, width, height, px, py) => {
                    const statusBarHeight =
                      Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
                    setListTopPosition(py + height - statusBarHeight);
                    setFocusedField('arr');
                    setSearchQuery(arr);
                  });
                }}
                onChangeText={(text) => {
                  setArr(text);
                  setSearchQuery(text);
                }}
              />
            </View>
          </View>

          <TouchableOpacity onPress={swapStations} style={styles.swapButton}>
            <MaterialCommunityIcons
              name="swap-vertical"
              size={40 + fontOffset }
              color="#17171B"
            />
          </TouchableOpacity>
        </View>

        {/* 휠체어 체크 */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkboxContainer}
          onPress={() => {
            setWheelchair(!wheelchair);
            setPathData(null);
          }}
        >
          <Ionicons
            name={wheelchair ? 'checkbox-outline' : 'square-outline'}
            size={26 + fontOffset / 2}
            color={wheelchair ? '#14CAC9' : '#999'}
          />
          <Text
            style={[
              styles.checkboxText,
              { fontSize: responsiveFontSize(16) + fontOffset },
            ]}
          >
            휠체어 이용자입니다
          </Text>
        </TouchableOpacity>

        {!isLoading && pathData === null && (
          <CustomButton type="feature" title="길찾기 시작" onPress={handleFindPath} />
        )}
      </View>

      {/* 결과 영역 */}
      <ScrollView
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!focusedField}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#14CAC9"
            style={{ marginTop: 40 }}
          />
        ) : (
          pathData && <PathResultView data={pathData} navigation={navigation} />
        )}
      </ScrollView>

      {/* 검색결과 드롭다운 */}
      {focusedField && searchResults.length > 0 && listTopPosition > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.name}
          keyboardShouldPersistTaps="handled"
          style={[styles.dropdown, { top: listTopPosition }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectStation(item)}
            >
              <Ionicons
                name="location-outline"
                size={24 + fontOffset / 1.5}
                color="#17171B"
                style={{ marginRight: 10 }}
              />
              <Text
                style={[
                  styles.stationName,
                  { fontSize: responsiveFontSize(16) + fontOffset },
                ]}
              >
                {item.name}
              </Text>
              <View style={styles.lineContainer}>
                {item.lines.map((line) => {
                  const color = getLineColor(line);
                  const textColor = getTextColorForBackground(color);
                  const lineCircleSize = 26 + fontOffset / 1.5;
                  return (
                    <View
                      key={line}
                      style={[
                        styles.lineCircle,
                        {
                          backgroundColor: color,
                          width: lineCircleSize,
                          height: lineCircleSize,
                          borderRadius: lineCircleSize / 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lineText,
                          { color: textColor, fontSize: 12 + fontOffset / 2.5 },
                        ]}
                      >
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    zIndex: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  noticeText: {
    flex: 1,
    color: '#17171B',
    fontWeight: '700',
    fontFamily: 'NotoSansKR',
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
  inputWrapper: { flex: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 50,
  },
  inputLabel: {
    width: responsiveFontSize(40),
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
  },
  divider: { height: 1, backgroundColor: '#EEE', marginHorizontal: 16 },
  swapButton: { padding: 16, justifyContent: 'center', alignItems: 'center' },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveHeight(1.5),
    marginBottom: responsiveHeight(1.5),
    paddingVertical: 8,
  },
  checkboxText: {
    marginLeft: 8,
    color: '#17171B',
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
  },
  scrollArea: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  dropdown: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#17171B',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 260,
    paddingVertical: 6,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    marginTop: -55,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  stationName: {
    flex: 1,
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
  },
  lineContainer: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  lineCircle: { justifyContent: 'center', alignItems: 'center' },
  lineText: { fontWeight: '700', textAlign: 'center' },
});

export default PathFinderScreen;
