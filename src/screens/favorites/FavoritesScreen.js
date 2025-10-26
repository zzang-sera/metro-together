import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '../../contexts/FontSizeContext';
import {
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight,
} from '../../utils/responsive';
import lineData from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

function getLineColor(lineNum) {
  const lineInfo = lineData.DATA.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#A8A8A8';
}

function getTextColorForBackground(hexColor) {
  if (!hexColor) return '#FFFFFF';
  try {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#17171B' : '#FFFFFF';
  } catch (e) {
    return '#FFFFFF';
  }
}

const FavoritesScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setFavoriteStations([]);
      setIsLoading(false);
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        setIsLoading(true);
        if (docSnap.exists()) {
          const favorites = docSnap.data().favorites || [];
          setFavoriteStations(favorites);
        } else {
          setFavoriteStations([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('즐겨찾기 로딩 실패:', error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser, isFocused]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#003F40" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.centered}>
        <Text
          style={[
            styles.infoText,
            { fontSize: responsiveFontSize(16) + fontOffset },
          ]}
        >
          로그인 후 자주 가는 역을 추가해보세요.
        </Text>
      </View>
    );
  }

  if (favoriteStations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text
          style={[
            styles.infoText,
            { fontSize: responsiveFontSize(16) + fontOffset },
          ]}
        >
          역 상세 화면에서 {'\n'}★ 아이콘을 눌러 즐겨찾기를 추가할 수 있습니다.
        </Text>
      </View>
    );
  }

  // ✅ 다중 호선 구조로 변경된 렌더링
  const renderFavoriteItem = ({ item }) => {
    const stationCode = item.stationCode;
    const stationName = item.stationName;
    const lines = Array.isArray(item.lines)
      ? item.lines
      : item.line
      ? [item.line]
      : [];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.stationCard}
        onPress={() =>
          navigation.navigate('MainStack', {
            screen: 'StationDetail',
            params: {
              stationCode,
              stationName,
              lines,
            },
          })
        }
      >
        <View style={styles.leftContent}>
          {/* ✅ 호선 뱃지 2개씩 줄맞춤 */}
          <View style={styles.lineContainer}>
            {Array.from({ length: Math.ceil(lines.length / 2) }).map(
              (_, rowIndex) => {
                const pair = lines.slice(rowIndex * 2, rowIndex * 2 + 2);
                return (
                  <View key={`row-${rowIndex}`} style={styles.lineRow}>
                    {pair.map((line) => {
                      const color = getLineColor(line);
                      const textColor = getTextColorForBackground(color);
                      return (
                        <View
                          key={line}
                          style={[
                            styles.lineCircle,
                            { backgroundColor: color },
                          ]}
                        >
                          <Text style={[styles.lineText, { color: textColor }]}>
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

          <Text
            style={[
              styles.stationName,
              { fontSize: responsiveFontSize(18) + fontOffset },
            ]}
          >
            {stationName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={30} color="#595959" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteStations}
        keyExtractor={(item, idx) => item.stationCode + idx}
        contentContainerStyle={{
          paddingHorizontal: responsiveWidth(16),
          paddingTop: responsiveHeight(10),
        }}
        renderItem={renderFavoriteItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { color: '#888', textAlign: 'center', lineHeight: 24 },
  stationCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveWidth(16),
    marginVertical: responsiveHeight(6),
    borderRadius: responsiveWidth(40),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  lineContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: responsiveWidth(9),
    gap: 4,
  },
  lineRow: { flexDirection: 'row', gap: 6 },
  lineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineText: { fontWeight: '700' },
  stationName: { fontWeight: '700', color: '#17171B' },
});

export default FavoritesScreen;
