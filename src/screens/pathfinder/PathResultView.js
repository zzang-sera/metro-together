import React, { useState, useEffect } from 'react'; // useState, useEffect 추가
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo, // AccessibilityInfo 추가
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

const lineData = lineJson.DATA;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#CCCCCC';
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

const InfoItem = ({
  iconComponent: IconComponent = Ionicons,
  icon,
  label,
  value,
  iconColor = '#14CAC9',
}) => {
  const { fontOffset } = useFontSize();
  const baseIconSize = 22;
  return (
    <View style={styles.infoItem}>
      <IconComponent name={icon} size={baseIconSize + fontOffset / 2} color={iconColor} />
      <Text style={[styles.infoLabel, { fontSize: responsiveFontSize(15) + fontOffset }]}>{label}:</Text>
      <Text style={[styles.infoValue, { fontSize: responsiveFontSize(15) + fontOffset }]}>{value}</Text>
    </View>
  );
};

const JourneyStep = ({
  icon: defaultIconName,
  title,
  description,
  lineNum,
  isFirst = false,
  isLast = false,
}) => {
  const { fontOffset } = useFontSize();
  const isDescriptionArray = Array.isArray(description);

  const renderIcon = () => {
    const lineNumberMatch = lineNum ? String(lineNum).match(/^(\d+)호선$/) : null;
    const lineNumber = lineNumberMatch ? parseInt(lineNumberMatch[1]) : null;
    const color = lineNumber ? getLineColor(lineNum) : null;

    if (lineNumber && color) {
      const textColor = getTextColorForBackground(color);
      return (
        <View style={[styles.timelineIconLine, { backgroundColor: color }]}>
          <Text
            style={[styles.timelineIconLineText, { color: textColor, fontSize: 18 + fontOffset / 2 }]}
            // ✅ "2" 대신 "2호선"으로 읽도록 라벨 추가
            accessibilityLabel={`${lineNumber}호선`}
          >
            {lineNumber}
          </Text>
        </View>
      );
    } else {
      // ✅ 아이콘에 대한 접근성 라벨 추가
      let iconLabel = '경로 단계';
      if (defaultIconName === 'train-outline') iconLabel = '출발';
      if (defaultIconName === 'swap-horizontal-outline') iconLabel = '환승';
      if (defaultIconName === 'flag-outline') iconLabel = '도착';

      return (
        <View style={styles.timelineIcon}>
          <Ionicons
            name={defaultIconName}
            size={24 + fontOffset / 2}
            color="#FFFFFF"
            accessibilityLabel={iconLabel}
          />
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
        <Text style={[styles.stepTitle, { fontSize: responsiveFontSize(17) + fontOffset }]}>{title}</Text>
        {isDescriptionArray ? (
          description.map((line, index) => (
            <Text key={index} style={[styles.stepDescription, { fontSize: responsiveFontSize(14) + fontOffset }]}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={[styles.stepDescription, { fontSize: responsiveFontSize(14) + fontOffset }]}>{description}</Text>
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

const cleanStationName = (rawName) => {
  if (!rawName) return '';
  return rawName
    .replace(/\(.*?\)/g, '')
    .replace(/역\s*$/u, '')
    .trim();
};

const PathResultView = ({ data }) => {
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  // ✅ 스크린리더 활성화 상태를 저장할 state
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // ✅ 컴포넌트 마운트 시 스크린리더 상태 확인
  useEffect(() => {
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };
    checkScreenReader();

    // 스크린리더 상태 변경 감지 리스너
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        setIsScreenReaderEnabled(isEnabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>경로 데이터를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const { routeSummary, transferInfo, stationFacilities } = data;
  const departureLine = extractLineFromSummary(routeSummary?.departure);
  const arrivalLine = extractLineFromSummary(routeSummary?.arrival);
  const allStations = require('../../assets/metro-data/metro/station/data-metro-station-1.0.0.json').DATA;

  const findStationCodeBy = (name, line) => {
    const clean = (s) => s.replace(/역\s*$/u, '').trim();
    const found = allStations.find((s) => clean(s.name) === clean(name) && s.line === line);
    return found ? found.station_cd : null;
  };

  const renderStationButton = (title, stationName, lineNum) => {
    const cleanName = cleanStationName(stationName);
    const color = getLineColor(lineNum);
    const textColor = getTextColorForBackground(color);
    const iconSize = 24 + fontOffset / 2;

    return (
      <TouchableOpacity
        key={cleanName}
        style={[styles.stationButton, { borderColor: color }]}
        onPress={() => {
          const code = findStationCodeBy(cleanName, lineNum);
          navigation.navigate('StationDetail', {
            stationName: cleanName,
            stationCode: code,
            lines: lineNum ? [lineNum] : [],
          });
        }}
        // ✅ 버튼의 역할을 명시
        accessibilityRole="button"
      >
        <View
          style={[
            styles.stationButtonIcon,
            { backgroundColor: color, width: iconSize, height: iconSize, borderRadius: iconSize / 2 },
          ]}
        >
          <Text
            style={[styles.stationButtonIconText, { color: textColor, fontSize: 13 + fontOffset / 3 }]}
            // ✅ "2" 대신 "2호선"으로 읽도록 라벨 추가
            accessibilityLabel={lineNum ? `${lineNum.replace('호선', '')}호선` : '알 수 없음'}
          >
            {lineNum?.replace('호선', '') || '?'}
          </Text>
        </View>
        <Text style={[styles.stationButtonText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
          {title}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20 + fontOffset / 2}
          color="#888888"
          accessibilityHidden={true} // ✅ 장식용 아이콘 숨김
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.scrollContainer}>
      {/* ✅ 스크린리더 사용자용 안내 메시지 */}
      {isScreenReaderEnabled && (
        <View style={styles.noticeBox} accessibilityRole="alert">
          <Ionicons
            name="information-circle-outline"
            size={responsiveFontSize(22) + fontOffset / 2}
            color="#0B5FFF"
            style={{ marginRight: 8 }}
            accessibilityHidden={true} // 장식용 아이콘
          />
          <Text style={[styles.noticeText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            화면을 내리려면 두 손가락으로 화면을 미세요.
          </Text>
        </View>
      )}

      {/* 요약 카드 */}
      <View
        style={styles.summaryCard}
        // ✅ 요약 카드 전체에 대한 접근성 라벨
        accessibilityLabel={`
          요약: ${routeSummary?.departure}에서 ${routeSummary?.arrival}까지.
          소요 시간: ${routeSummary?.estimatedTime || '정보 없음'}.
          환승: ${routeSummary?.transfers || 0}회.
        `}
      >
        <Text style={[styles.summaryTitle, { fontSize: responsiveFontSize(20) + fontOffset }]} accessibilityHidden={true}>
          {routeSummary?.departure} → {routeSummary?.arrival}
        </Text>

        <InfoItem iconComponent={Ionicons} icon="time" label="소요 시간" value={routeSummary?.estimatedTime || '정보 없음'} />
        <InfoItem iconComponent={MaterialCommunityIcons} icon="swap-horizontal-bold" label="환승" value={`${routeSummary?.transfers || 0}회`} />
      </View>

      {/* 출발역, 환승역, 도착역 */}
      {stationFacilities?.departure && (
        <JourneyStep
          icon="train-outline"
          title={`출발: ${stationFacilities.departure.station}`}
          description={stationFacilities.departure.displayLines || stationFacilities.departure.text}
          lineNum={departureLine}
          isFirst
        />
      )}

      {transferInfo?.map((info) => (
        <JourneyStep
          key={info.index}
          icon="swap-horizontal-outline"
          title={`${info.index}회 환승: ${info.station}`}
          description={info.displayLines || info.text}
          lineNum={info.toLine}
        />
      ))}

      {stationFacilities?.arrival && (
        <JourneyStep
          icon="flag-outline"
          title={`도착: ${stationFacilities.arrival.station}`}
          description={stationFacilities.arrival.displayLines || stationFacilities.arrival.text}
          lineNum={arrivalLine}
          isLast
        />
      )}

      {/* 역 정보 보기 버튼 (새 디자인 적용) */}
      <View style={styles.stationButtonContainer}>
        {stationFacilities?.departure &&
          renderStationButton(
            `${cleanStationName(stationFacilities.departure.station)}역 정보 보기`,
            stationFacilities.departure.station,
            departureLine
          )}
        {transferInfo?.map((info, idx) =>
          renderStationButton(`${cleanStationName(info.station)}역 정보 보기`, info.station, info.toLine)
        )}
        {stationFacilities?.arrival &&
          renderStationButton(
            `${cleanStationName(stationFacilities.arrival.station)}역 정보 보기`,
            stationFacilities.arrival.station,
            arrivalLine
          )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 50 },
  // ✅ 추가된 스타일: 스크롤 안내
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16, // 요약 카드와 간격
  },
  noticeText: {
    flex: 1,
    color: '#17171B',
    fontWeight: '700',
    fontFamily: 'NotoSansKR', // 폰트가 있다면 적용됩니다.
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  errorText: {
    color: 'red',
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
    fontWeight: '700',
    color: '#17171B',
    marginBottom: 16,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoLabel: { fontWeight: '700', color: '#595959', marginLeft: 8, marginRight: 4 },
  infoValue: { fontWeight: '700', color: '#17171B', flex: 1 },
  stepContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  stepIconContainer: { width: 40, alignItems: 'center', marginRight: 12, paddingTop: 4 },
  timelineIconLine: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DDD',
  },
  timelineIconLineText: { fontWeight: '700' },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#14CAC9', justifyContent: 'center', alignItems: 'center' },
  timelineTrackTop: { position: 'absolute', width: 3, backgroundColor: '#DDD', top: 0, height: 4 },
  timelineTrackBottom: { position: 'absolute', width: 3, backgroundColor: '#DDD', top: 44, height: '100%' },
  stepContent: { flex: 1, paddingVertical: 4, paddingBottom: 16 },
  stepTitle: { fontWeight: '700', color: '#17171B', marginBottom: 4 },
  stepDescription: { color: '#333', fontWeight: '700', marginBottom: 4 },
  stationButtonContainer: { marginTop: 20, marginBottom: 40 },
  stationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stationButtonIcon: { justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stationButtonIconText: { fontWeight: 'bold', textAlign: 'center' },
  stationButtonText: { flex: 1, fontWeight: '700', color: '#17171B' },
});

export default PathResultView;