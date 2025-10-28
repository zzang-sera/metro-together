import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';
import CustomButton from '../../components/CustomButton';

const PathResultView = ({ data }) => {
  const { fontOffset } = useFontSize();

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>경로 데이터를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const {
    totalTime,
    totalDistance,
    transfers,
    routeSummary,
    transferInfo,
    stationFacilities,
    wheelchairStatus,
  } = data;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* 제목 */}
      <View style={styles.header}>
        <Text
          accessibilityLabel={`${routeSummary?.departure || ''}에서 ${routeSummary?.arrival || ''}까지의 이동 경로입니다.`}
          style={[styles.title, { fontSize: responsiveFontSize(22) + fontOffset }]}
        >
          {routeSummary?.departure} → {routeSummary?.arrival}
        </Text>
        <Text
          accessibilityLabel="최단 경로 안내 결과입니다."
          style={[styles.subtitle, { fontSize: responsiveFontSize(15) + fontOffset }]}
        >
          최단 경로 안내 결과입니다.
        </Text>
      </View>

      {/* 요약 카드 */}
      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={22} color="#14CAC9" />
          <Text
            accessibilityLabel={`소요 시간은 ${totalTime || 0}분입니다.`}
            style={styles.summaryText}
          >
            소요 시간: {totalTime || 0}분
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="swap-horizontal-outline" size={22} color="#14CAC9" />
          <Text
            accessibilityLabel={`환승은 ${transfers || 0}회입니다.`}
            style={styles.summaryText}
          >
            환승: {transfers || 0}회
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="trail-sign-outline" size={22} color="#14CAC9" />
          <Text
            accessibilityLabel={`총 이동 거리는 ${totalDistance || 0}미터입니다.`}
            style={styles.summaryText}
          >
            거리: {totalDistance || 0}m
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons
            name={wheelchairStatus === 'OK' ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={22}
            color={wheelchairStatus === 'OK' ? '#14CAC9' : 'red'}
          />
          <Text
            accessibilityLabel={`교통약자 이동 상태: ${wheelchairStatus === 'OK' ? '이용 가능' : '제한 있음'}`}
            style={styles.summaryText}
          >
            교통약자 이동 {wheelchairStatus === 'OK' ? '가능' : '제한 있음'}
          </Text>
        </View>
      </View>

      {/* 환승 정보 */}
      {transferInfo?.length > 0 && (
        <View style={styles.section}>
          <Text
            accessibilityLabel="환승 안내입니다."
            style={styles.sectionTitle}
          >
            🚉 환승 안내
          </Text>
          {transferInfo.map((info, i) => (
            <Text
              key={i}
              accessibilityLabel={`${info.text}.`}
              style={styles.detailText}
            >
              {info.text}
            </Text>
          ))}
        </View>
      )}

      {/* 승강기 정보 */}
      {stationFacilities && (
        <View style={styles.section}>
          <Text
            accessibilityLabel="승강기 및 주요 시설 안내입니다."
            style={styles.sectionTitle}
          >
            🛗 주요 시설 안내
          </Text>

          {/* 출발역 */}
          {stationFacilities.departure && (
            <Text
              accessibilityLabel={`${stationFacilities.departure.text}.`}
              style={styles.detailText}
            >
              출발: {stationFacilities.departure.text}
            </Text>
          )}

          {/* 환승역들 */}
          {stationFacilities.transfers?.map((t, i) => (
            <Text
              key={i}
              accessibilityLabel={`${t.text}.`}
              style={styles.detailText}
            >
              환승: {t.text}
            </Text>
          ))}

          {/* 도착역 */}
          {stationFacilities.arrival && (
            <Text
              accessibilityLabel={`${stationFacilities.arrival.text}.`}
              style={styles.detailText}
            >
              도착: {stationFacilities.arrival.text}
            </Text>
          )}
        </View>
      )}

      <View style={{ marginBottom: 40 }}>
        <CustomButton
          type="feature"
          title="노선 안내 보기"
          onPress={() => alert('노선 안내 기능은 곧 추가됩니다.')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 50 },
  header: { marginBottom: 24 },
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
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryText: {
    marginLeft: 10,
    fontFamily: 'NotoSansKR',
    fontWeight: '600',
    color: '#17171B',
    fontSize: responsiveFontSize(15),
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    fontSize: responsiveFontSize(17),
    marginBottom: 8,
  },
  detailText: {
    fontFamily: 'NotoSansKR',
    color: '#333',
    fontSize: responsiveFontSize(14),
    marginBottom: 4,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: {
    color: 'red',
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveFontSize(16),
  },
});

export default PathResultView;
