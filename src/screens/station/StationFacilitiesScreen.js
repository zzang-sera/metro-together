// src/screens/station/StationFacilitiesScreen.js
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FacilitiesSection, { FAC } from './FacilitiesSection';
import { getFacilityLocation } from '../../api/facilities';

// 상세 카드에 필요한 데이터(호선/색상)
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';
const allStations = stationJson.DATA;
const lineData = lineJson.DATA;
const lineColor = (line) => lineData.find((l) => l.line === line)?.color ?? '#666';

export default function StationFacilitiesScreen({ route, navigation }) {
  const { stationName, line: initialLine } = route.params ?? {};

  // mode=false(자세히 보기), mode=true(한눈에 보기)
  const [overview, setOverview] = useState(false);
  const [focusKey, setFocusKey] = useState(null);

  // 헤더 오른쪽 pill: 누를 때마다 모드 전환
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${stationName}역`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setOverview((v) => !v)}
          style={s.headerPill}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.headerPillText}>{overview ? '자세히 보기' : '한눈에 보기'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, stationName, overview]);

  // 이 역이 속한 모든 호선(상세 카드에서 사용)
  const lines = useMemo(() => {
    const matches = allStations.filter((st) => st.name === stationName);
    const uniq = Array.from(new Set(matches.map((m) => m.line)));
    return uniq.length ? uniq : (initialLine ? [initialLine] : ['-']);
  }, [stationName, initialLine]);

  // 상세 카드에서 특정 타일을 바로 보고 싶을 때(옵션)
  const openOverviewFocused = (key) => {
    setFocusKey(key);
    setOverview(true);
  };

  return (
    <View style={s.root}>
      {/* 모드 1: 자세히 보기(카드 리스트) */}
      {!overview && (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
          {lines.map((ln) => (
            <DetailCard
              key={ln}
              stationName={stationName}
              line={ln}
              onChipPress={openOverviewFocused} // 칩 누르면 한눈에 보기로 전환(선택)
            />
          ))}
        </ScrollView>
      )}

      {/* 모드 2: 한눈에 보기(그리드) */}
      {overview && (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
          <FacilitiesSection
            stationName={stationName}
            fetchLocation={getFacilityLocation}
            focusKey={focusKey}
            showResult
          />
        </ScrollView>
      )}
    </View>
  );
}

/* ====== 상세 카드 컴포넌트(사진2 레이아웃) ====== */
function DetailCard({ stationName, line, onChipPress }) {
  const color = lineColor(line);

  return (
    <View style={s.card}>
      {/* 헤더: 호선 pill + 역명 + 즐겨찾기 */}
      <View style={s.cardHeader}>
        <View style={[s.lineBadge, { borderColor: color }]}>
          <Text style={[s.lineBadgeText, { color }]}>{line}</Text>
        </View>
        <Text style={s.cardTitle}>{stationName}</Text>
        <TouchableOpacity style={s.starBtn}>
          <Ionicons name="star-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 전화 */}
      <View style={s.row}>
        <Ionicons name="call-outline" size={18} color="#333" />
        <Text style={s.phoneText}>02 - XXXX - XXXX</Text>
      </View>

      {/* 사용 가능 시설 칩 */}
      <View style={s.rowWrap}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#14CAC9" />
        <View style={s.chipRow}>
          <Chip label="엘리베이터" onPress={() => onChipPress?.(FAC.ELEVATOR)} />
          <Chip label="에스컬레이터" onPress={() => onChipPress?.(FAC.ESCALATOR)} />
          <Chip label="수유실" onPress={() => onChipPress?.(FAC.NURSING)} />
        </View>
      </View>

      {/* 미설치/준비 중 */}
      <View style={s.rowWrap}>
        <Ionicons name="close-circle-outline" size={20} color="#999" />
        <View style={s.chipRow}>
          <Chip label="휠체어 충전기" type="ghost" />
        </View>
      </View>

      {/* 하단: 거리/자세히보기(아이콘만 유지, 네비게이션 없음) */}
      <View style={s.footerRow}>
        <Text style={s.distance}>1.1km</Text>
        <View style={s.more}>
          <Text style={s.moreText}>자세히 보기</Text>
          <Ionicons name="arrow-forward-circle-outline" size={18} color="#555" />
        </View>
      </View>
    </View>
  );
}

function Chip({ label, type = 'filled', onPress }) {
  const Comp = (
    <View style={type === 'filled' ? s.chip : s.chipGhost}>
      <Text style={type === 'filled' ? s.chipText : s.chipGhostText}>{label}</Text>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {Comp}
    </TouchableOpacity>
  ) : (
    Comp
  );
}

/* ====== 스타일 ====== */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 24 },

  headerPill: {
    borderWidth: 1, borderColor: '#0BA7A6',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8,
  },
  headerPillText: { color: '#0BA7A6', fontWeight: '700' },

  /* 카드 */
  card: {
    backgroundColor: '#F3F6F8',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  lineBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, marginRight: 10,
    backgroundColor: '#fff',
  },
  lineBadgeText: { fontSize: 13, fontWeight: '800' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  starBtn: { padding: 6 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, gap: 8,
    backgroundColor: '#fff', borderRadius: 12, padding: 10,
  },
  phoneText: { fontSize: 15, color: '#333' },

  rowWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: { backgroundColor: '#14CAC9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  chipGhost: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: '#BFD9DE',
    backgroundColor: '#fff',
  },
  chipGhostText: { color: '#2A3B44', fontWeight: '700', fontSize: 12 },

  footerRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distance: { fontSize: 16, fontWeight: '800', color: '#111' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreText: { fontWeight: '700', color: '#555' },
});
