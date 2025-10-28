//src/screens/pathfinder/PathResultScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';
import CustomButton from '../../components/CustomButton';

const PathResultScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  const { pathData, dep, arr } = route.params || {};

  if (!pathData) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>경로 데이터를 불러올 수 없습니다.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>뒤로가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { totalTime, totalDistance, transfers, arrivalInfo, wheelchairStatus, paths } = pathData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 제목 */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: responsiveFontSize(22) + fontOffset }]}>
            {dep} → {arr}
          </Text>
          <Text style={[styles.subtitle, { fontSize: responsiveFontSize(15) + fontOffset }]}>
            최단 경로 안내 결과입니다.
          </Text>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={22} color="#14CAC9" />
            <Text style={styles.summaryText}>소요 시간: {totalTime || 0}분</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="swap-horizontal-outline" size={22} color="#14CAC9" />
            <Text style={styles.summaryText}>환승: {transfers || 0}회</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="trail-sign-outline" size={22} color="#14CAC9" />
            <Text style={styles.summaryText}>정차역: {totalDistance || 0}개</Text>
          </View>
          <View style={styles.row}>
            <Ionicons
              name={wheelchairStatus === 'OK' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={22}
              color={wheelchairStatus === 'OK' ? '#14CAC9' : 'red'}
            />
            <Text style={styles.summaryText}>
              교통약자 이동 {wheelchairStatus === 'OK' ? '가능' : '제한 있음'}
            </Text>
          </View>
        </View>

        {/* 노선 정보 */}
        {paths?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚉 이동 구간</Text>
            {paths.map((p, i) => (
              <View key={i} style={styles.pathItem}>
                <Text style={styles.pathText}>
                  {p.line} {p.from} → {p.to}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 빠른하차칸 */}
        {arrivalInfo?.quickExit?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚪 빠른하차 정보</Text>
            {arrivalInfo.quickExit.map((q, i) => (
              <Text key={i} style={styles.detailText}>
                {q.stationName} ({q.line}) — {q.doorNumber}호차, {q.direction || '방향 정보 없음'}
              </Text>
            ))}
          </View>
        )}

        {/* 시설 안내 */}
        {arrivalInfo?.facilities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛗 주요 시설</Text>
            {arrivalInfo.facilities.map((f, i) => (
              <Text key={i} style={styles.detailText}>
                {f.facilityName} ({f.status}) — {f.position}
              </Text>
            ))}
          </View>
        )}

        {/* 버튼 */}
        <CustomButton
          type="feature"
          title="노선안내 보기"
          onPress={() => navigation.navigate('BarrierFreeMap', { stationName: arr })}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  scrollContainer: {
    paddingBottom: 50,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    color: '#595959',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    marginLeft: 10,
    fontFamily: 'NotoSansKR',
    fontWeight: '600',
    color: '#17171B',
    fontSize: responsiveFontSize(15),
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    fontSize: responsiveFontSize(17),
    marginBottom: 8,
  },
  pathItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  pathText: {
    fontFamily: 'NotoSansKR',
    fontWeight: '600',
    color: '#333',
  },
  detailText: {
    fontFamily: 'NotoSansKR',
    color: '#333',
    fontSize: responsiveFontSize(14),
    marginBottom: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveFontSize(16),
  },
  backText: {
    color: '#14CAC9',
    fontWeight: '600',
    marginTop: 10,
  },
});

export default PathResultScreen;
