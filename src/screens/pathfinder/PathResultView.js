// src/screens/pathfinder/PathResultView.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';
import CustomButton from '../../components/CustomButton';

// InfoItem 헬퍼 컴포넌트 (변경 없음)
const InfoItem = ({ icon, label, value, iconColor = '#14CAC9', ...props }) => {
  const { fontOffset } = useFontSize();
  return (
    <View 
      style={styles.infoItem}
      accessibilityLabel={`${label}: ${value}`}
      {...props}
    >
      <Ionicons name={icon} size={20 + fontOffset / 2} color={iconColor} />
      <Text style={[styles.infoLabel, { fontSize: responsiveFontSize(15) + fontOffset }]}>{label}:</Text>
      <Text style={[styles.infoValue, { fontSize: responsiveFontSize(15) + fontOffset }]}>{value}</Text>
    </View>
  );
};

// [수정] JourneyStep 헬퍼 컴포넌트 (description을 string 또는 array로 받도록)
const JourneyStep = ({ icon, title, description, isFirst = false, isLast = false }) => {
  const { fontOffset } = useFontSize();

  // description이 배열인지 확인
  const isDescriptionArray = Array.isArray(description);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepIconContainer}>
        {!isFirst && <View style={styles.timelineTrackTop} />}
        <View style={styles.timelineIcon}>
          <Ionicons name={icon} size={24 + fontOffset / 2} color="#FFFFFF" />
        </View>
        {!isLast && <View style={styles.timelineTrackBottom} />}
      </View>
      <View style={styles.stepContent}>
        <Text 
          style={[styles.stepTitle, { fontSize: responsiveFontSize(17) + fontOffset }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {/* [수정] 배열이면 map으로, 문자열이면 Text로 바로 렌더링 */}
        {isDescriptionArray ? (
          description.map((line, index) => (
            <Text 
              key={index}
              style={[styles.stepDescription, { fontSize: responsiveFontSize(14) + fontOffset }]}
            >
              {line}
            </Text>
          ))
        ) : (
          <Text style={[styles.stepDescription, { fontSize: responsiveFontSize(14) + fontOffset }]}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
};

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
    routeSummary,
    transferInfo,
    stationFacilities,
    wheelchairStatus,
  } = data;

  return (
    <View style={styles.scrollContainer}>
      
      {/* 1. 요약 카드 (변경 없음) */}
      <View style={styles.summaryCard}>
        <Text 
          style={[styles.summaryTitle, { fontSize: responsiveFontSize(20) + fontOffset }]}
          accessibilityLabel={`${routeSummary?.departure}에서 ${routeSummary?.arrival}까지 경로`}
          accessibilityRole="header"
        >
          {routeSummary?.departure} → {routeSummary?.arrival}
        </Text>
        <View style={styles.summaryRow}>
          <InfoItem
            icon="time-outline"
            label="소요 시간"
            value={routeSummary?.estimatedTime || '정보 없음'}
          />
          <InfoItem
            icon="swap-horizontal-outline"
            label="환승"
            value={`${routeSummary?.transfers || 0}회`}
          />
        </View>
        <InfoItem
          icon={wheelchairStatus === 'OK' ? 'checkmark-circle-outline' : 'close-circle-outline'}
          label="교통약자 이동"
          value={wheelchairStatus === 'OK' ? '이동 가능' : '이동 제한'}
          iconColor={wheelchairStatus === 'OK' ? '#14CAC9' : '#D32F2F'}
        />
      </View>

      {/* [수정] 2. 출발역 정보 (displayLines 사용) */}
      {stationFacilities?.departure && (
        <JourneyStep
          icon="train-outline"
          title={`출발: ${stationFacilities.departure.station}역`}
          description={stationFacilities.departure.displayLines || stationFacilities.departure.text}
          isFirst
        />
      )}

      {/* [수정] 3. 환승 정보 (API 구조에 맞게 수정) */}
      {transferInfo?.map((info) => (
        <JourneyStep
          key={info.index}
          icon="swap-horizontal-outline"
          title={`${info.index}회 환승: ${info.station}`}
          description={info.displayLines || info.text}
        />
      ))}

      {/* [수정] 4. 도착역 정보 (displayLines 사용) */}
      {stationFacilities?.arrival && (
        <JourneyStep
          icon="flag-outline"
          title={`도착: ${stationFacilities.arrival.station}역`}
          description={stationFacilities.arrival.displayLines || stationFacilities.arrival.text}
          isLast
        />
      )}

      {/* 5. 노선 안내 버튼 (변경 없음) */}
      <View style={{ marginBottom: 40, marginTop: 20 }}>
        <CustomButton
          type="feature"
          title="노선 안내 보기"
          onPress={() => alert('노선 안내 기능은 곧 추가됩니다.')}
          accessibilityLabel="노선 안내 보기"
          accessibilityRole="button"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (다른 스타일은 모두 동일) ...
  scrollContainer: { paddingBottom: 50 }, 
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  errorText: {
    color: 'red',
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveFontSize(16),
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
  summaryTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexShrink: 1,
  },
  infoLabel: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#595959',
    marginLeft: 8,
    marginRight: 4,
  },
  infoValue: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    flexShrink: 1,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepIconContainer: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
    marginRight: 12,
    paddingTop: 4,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14CAC9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineTrackTop: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#DDD',
    top: 0,
    height: 4,
    zIndex: 0,
  },
  timelineTrackBottom: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#DDD',
    top: 44,
    height: '100%',
    zIndex: 0,
  },
  stepContent: {
    flex: 1,
    paddingVertical: 4,
    paddingBottom: 16,
  },
  stepTitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    marginBottom: 4,
    lineHeight: responsiveFontSize(24),
  },
  stepDescription: {
    fontFamily: 'NotoSansKR',
    color: '#333',
    lineHeight: responsiveFontSize(20),
    fontWeight: '700',
    marginBottom: 4, 
  },
});

export default PathResultView;