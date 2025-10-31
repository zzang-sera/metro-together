import { StyleSheet, Dimensions } from 'react-native';

const { width: screenW, height: screenH } = Dimensions.get('window');

// ✅ [수정] 붉은색(destructive) 추가
export const colors = {
  text: '#17171B',
  textSecondary: '#555555',
  textOnPrimary: '#0D0D0D',
  primary: '#14CAC9',
  background: '#F9F9F9',
  white: '#FFFFFF',
  border: '#EEEEEE',
  destructive: '#D32F2F', // 사용 불가/보수중
};

export default StyleSheet.create({
  // ... container, title, map styles (변경 없음) ...
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },
  imageContainer: {
    width: screenW,
    height: screenH * 0.55,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // --- 리스트 스타일 ---
  listContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  
  // ✅ [추가] Request 3: JSON 안내문 스타일
  disclaimerBox: {
    backgroundColor: '#FFFBEB', // 밝은 노란색
    borderColor: '#FEEB8A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerText: {
    color: '#8A6100', // 어두운 노란색 계열
    fontWeight: '500',
    textAlign: 'center',
  },

  // --- 카드 스타일 ---
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#1A1E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2, // ✅ [수정] 테두리 기본 두께
    borderColor: colors.white, // ✅ [수정] 기본 테두리 색상 (투명)
  },
  // ✅ [추가] Request 2: 상태별 테두리 스타일
  cardBorderAvailable: {
    borderColor: colors.primary, // 민트색
  },
  cardBorderUnavailable: {
    borderColor: colors.destructive, // 붉은색
  },

  // ... cardHeader, cardIcon, facilityTitle (변경 없음) ...
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  facilityTitle: {
    fontWeight: '700',
    color: colors.text,
  },

  facilityDesc: {
    color: colors.textSecondary,
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  // ✅ [추가] Request 2: 새로운 상태 텍스트 스타일
  statusTextBase: {
    fontWeight: '700',
    flexShrink: 1, // 공간이 부족하면 줄바꿈
    marginRight: 8,
  },
  statusTextAvailable: {
    color: colors.primary,
  },
  statusTextUnavailable: {
    color: colors.destructive,
  },
  
  // ✅ [제거] 기존 배지 스타일 (statusBadge, statusBadgeText)
  // statusBadge: { ... }
  // statusBadgeText: { ... }

  facilityContact: {
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },

  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

