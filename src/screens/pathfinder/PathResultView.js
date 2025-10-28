// src/screens/pathfinder/PathResultView.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// [수정] MaterialCommunityIcons만 추가
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';
import CustomButton from '../../components/CustomButton';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

const lineData = lineJson.DATA;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : null;
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

// [수정] InfoItem: 기본 IconComponent를 Ionicons로 다시 설정
const InfoItem = ({ iconComponent: IconComponent = Ionicons, icon, label, value, iconColor = '#14CAC9', ...props }) => {
  const { fontOffset } = useFontSize();
  const baseIconSize = 22;
  return (
    <View
      style={styles.infoItem}
      accessibilityLabel={`${label}: ${value}`}
      {...props}
    >
      <IconComponent name={icon} size={baseIconSize + fontOffset / 2} color={iconColor} />
      <Text style={[styles.infoLabel, { fontSize: responsiveFontSize(15) + fontOffset }]}>{label}:</Text>
      <Text style={[styles.infoValue, { fontSize: responsiveFontSize(15) + fontOffset }]}>{value}</Text>
    </View>
  );
};

// JourneyStep 헬퍼 컴포넌트 (변경 없음)
const JourneyStep = ({ icon: defaultIconName, title, description, lineNum, isFirst = false, isLast = false }) => {
  const { fontOffset } = useFontSize();
  const isDescriptionArray = Array.isArray(description);

  const renderIcon = () => {
    const lineNumberMatch = lineNum ? String(lineNum).match(/^(\d+)호선$/) : null;
    const lineNumber = lineNumberMatch ? parseInt(lineNumberMatch[1]) : null;
    const color = lineNumber ? getLineColor(lineNum) : null;

    if (lineNumber && lineNumber >= 1 && lineNumber <= 9 && color) {
      const textColor = getTextColorForBackground(color);
      return (
        <View style={[styles.timelineIconLine, { backgroundColor: color }]}>
          <Text style={[styles.timelineIconLineText, { color: textColor, fontSize: 18 + fontOffset / 2 }]}>
            {lineNumber}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.timelineIcon}>
           <Ionicons name={defaultIconName} size={24 + fontOffset / 2} color="#FFFFFF" />
        </View>
      );
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepIconContainer}>
        {!isFirst && <View style={styles.timelineTrackTop} />}
        {renderIcon()}
        {!isLast && <View style={styles.timelineTrackBottom} />}
      </View>
      <View style={styles.stepContent}>
        <Text
          style={[styles.stepTitle, { fontSize: responsiveFontSize(17) + fontOffset }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
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

const extractLineFromSummary = (summaryText) => {
    if (!summaryText) return null;
    const match = summaryText.match(/\(([^)]+)\)$/);
    return match ? match[1] : null;
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
  } = data;

  const departureLine = extractLineFromSummary(routeSummary?.departure);
  const arrivalLine = extractLineFromSummary(routeSummary?.arrival);

  return (
    <View style={styles.scrollContainer}>

      {/* 1. 요약 카드 */}
      <View style={styles.summaryCard}>
         <Text
          style={[styles.summaryTitle, { fontSize: responsiveFontSize(20) + fontOffset }]}
          accessibilityLabel={`${routeSummary?.departure}에서 ${routeSummary?.arrival}까지 경로`}
          accessibilityRole="header"
        >
          {routeSummary?.departure} → {routeSummary?.arrival}
        </Text>
        {/* [수정] 소요 시간 아이콘: Ionicons 'time' (굵은 버전) */}
        <InfoItem
          iconComponent={Ionicons} // 기본값 Ionicons 사용
          icon="time" // 'time-outline' 대신 'time' 사용
          label="소요 시간"
          value={routeSummary?.estimatedTime || '정보 없음'}
        />
        {/* [수정] 환승 아이콘: MaterialCommunityIcons 'swap-horizontal-bold' */}
        <InfoItem
          iconComponent={MaterialCommunityIcons}
          icon="swap-horizontal-bold"
          label="환승"
          value={`${routeSummary?.transfers || 0}회`}
        />
      </View>

      {/* 2. 출발역 정보 (변경 없음) */}
      {stationFacilities?.departure && (
        <JourneyStep
          icon="train-outline"
          title={`출발: ${stationFacilities.departure.station}역`}
          description={stationFacilities.departure.displayLines || stationFacilities.departure.text}
          lineNum={departureLine}
          isFirst
        />
      )}

      {/* 3. 환승 정보 (변경 없음) */}
      {transferInfo?.map((info) => (
        <JourneyStep
          key={info.index}
          icon="swap-horizontal-outline"
          title={`${info.index}회 환승: ${info.station}`}
          description={info.displayLines || info.text}
          lineNum={info.toLine}
        />
      ))}

      {/* 4. 도착역 정보 (변경 없음) */}
      {stationFacilities?.arrival && (
        <JourneyStep
          icon="flag-outline"
          title={`도착: ${stationFacilities.arrival.station}역`}
          description={stationFacilities.arrival.displayLines || stationFacilities.arrival.text}
          lineNum={arrivalLine}
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
    flex: 1,
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
  timelineIconLine: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      borderWidth: 1,
      borderColor: '#DDD',
  },
  timelineIconLineText: {
      fontWeight: '700',
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
  },
  stepDescription: {
    fontFamily: 'NotoSansKR',
    color: '#333',
    fontWeight: '700',
    marginBottom: 4,
  },
});

export default PathResultView;