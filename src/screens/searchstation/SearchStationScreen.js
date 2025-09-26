import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';


// 데이터 파일에서 실제 배열을 가져옵니다.
const allStations = stationJson.DATA;
const lineData = lineJson.DATA;


// 호선 색상을 찾는 헬퍼 함수
function getLineColor(lineNum) {
  const lineInfo = lineData.find(l => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}


// 메인 컴포넌트
const SearchStationScreen = () => {
  // 사용자가 입력한 검색어를 저장할 state
  const [searchQuery, setSearchQuery] = useState('');


  // 검색 결과를 저장할 state
  const searchResults = useMemo(() => {
    // 검색어가 없으면 아무것도 보여주지 않습니다.
    if (!searchQuery.trim()) {
      return [];
    }


    // 1. 검색어와 일치하는 모든 역을 찾습니다.
    const matchingStations = allStations.filter(station =>
      station.name.startsWith(searchQuery)
    );


    // 2. 환승역 데이터를 합칩니다.
    // 예: '노원'역에 대한 { name: '노원', lines: ['4호선', '7호선'] } 형태의 객체를 만듭니다.
    const stationMap = new Map();


    matchingStations.forEach(station => {
      if (stationMap.has(station.name)) {
        // 이미 맵에 역 이름이 있으면, 호선 정보만 추가합니다.
        const existingStation = stationMap.get(station.name);
        existingStation.lines.push(station.line);
      } else {
        // 맵에 새로운 역이면, 역 정보와 함께 호선 배열을 추가합니다.
        stationMap.set(station.name, {
          name: station.name,
          lines: [station.line],
        });
      }
    });
   
    // 맵의 값들을 배열로 변환하여 최종 결과로 사용합니다.
    return Array.from(stationMap.values());
  }, [searchQuery]); // searchQuery가 변경될 때만 이 계산을 다시 실행합니다.


  return (
    <SafeAreaView style={styles.container}>
      {/* 뒤로가기 버튼과 타이틀 (실제 구현 시 네비게이션 헤더 사용) */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.headerTitle}>원하는 역 검색</Text>
      </View>


      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="역 이름을 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery} // 입력할 때마다 searchQuery state 업데이트
          autoFocus={true} // 화면이 뜨면 바로 키보드 나타남
        />
        {searchQuery.length > 0 && (
            <View style={styles.searchButton}>
                <Text style={styles.searchButtonText}>검색</Text>
            </View>
        )}
      </View>


      {/* 검색 결과 목록 */}
      <FlatList
        data={searchResults}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Ionicons name="location-outline" size={24} color="black" style={styles.locationIcon}/>
            <Text style={styles.stationName}>{item.name}</Text>
            <View style={styles.lineContainer}>
              {item.lines.map(line => (
                <View
                  key={line}
                  style={[styles.lineCircle, { backgroundColor: getLineColor(line) }]}
                >
                  <Text style={styles.lineText}>{line.replace('호선', '')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        // 검색 결과가 없을 때 보여줄 메시지 (선택사항)
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#00B8D4',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchButtonText: {
      color: 'white',
      fontWeight: 'bold',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: {
      marginRight: 12,
  },
  stationName: {
    flex: 1,
    fontSize: 16,
  },
  lineContainer: {
    flexDirection: 'row',
  },
  lineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  lineText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 20,
      color: 'gray',
  }
});


export default SearchStationScreen;



