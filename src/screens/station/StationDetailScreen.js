// src/screens/station/StationDetailScreen.js
import React, { useMemo, useLayoutEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

// 데이터 배열
const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

// 호선 → 색상
function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

export default function StationDetailScreen({ route, navigation }) {
  const { stationName } = route.params ?? {};

  // 헤더 우측: 한눈에 보기(요약 화면으로 이동)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${stationName}역`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('시설', { stationName, line: firstLine })}
          style={s.headerPill}
        >
          <Text style={s.headerPillText}>한눈에 보기</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, stationName]);

  // 이 역이 가진 모든 호선 카드 생성 (스크린샷처럼 카드 2장 이상일 수 있음)
  const lines = useMemo(() => {
    const matches = allStations.filter((st) => st.name === stationName);
    const uniq = Array.from(new Set(matches.map((m) => m.line)));
    return uniq.length ? uniq : ['-'];
  }, [stationName]);

  const firstLine = lines[0];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {lines.map((line) => (
        <StationCard
          key={line}
          stationName={stationName}
          line={line}
          distanceKm={1.1} // TODO: 실제 거리 넣고 싶으면 route.params에서 넘겨주기
          phone={'02 - XXXX - XXXX'} // TODO: 데이터 붙이면 교체
        />
      ))}
    </ScrollView>
  );
}

/* ===== 카드 ===== */
function StationCard({ stationName, line, phone, distanceKm }) {
  const [fav, setFav] = useState(false);

  return (
    <View style={s.card}>
      {/* 헤더: 호선 pill + 역명 + 즐겨찾기 */}
      <View style={s.cardHeader}>
        <View style={[s.lineBadge, { borderColor: getLineColor(line) }]}>
          <Text style={[s.lineBadgeText, { color: getLineColor(line) }]}>
            {line}
          </Text>
        </View>
        <Text style={s.cardTitle}>{stationName}</Text>
        <TouchableOpacity onPress={() => setFav((v) => !v)} style={s.starBtn}>
          <Ionicons name={fav ? 'star' : 'star-outline'} size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 전화 */}
      <View style={s.row}>
        <Ionicons name="call-outline" size={18} color="#333" />
        <Text style={s.phoneText}>{phone}</Text>
      </View>

      {/* 사용 가능 시설 */}
      <View style={s.rowWrap}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#14CAC9" />
        <View style={s.chipRow}>
          <Chip label="엘리베이터" />
          <Chip label="에스컬레이터" />
          <Chip label="수유실" />
        </View>
      </View>

      {/* 준비/미설치 등 */}
      <View style={s.rowWrap}>
        <Ionicons name="close-circle-outline" size={20} color="#999" />
        <View style={s.chipRow}>
          <Chip label="휠체어 충전기" type="ghost" />
        </View>
      </View>

      {/* 하단: 거리 / 자세히 보기(더 깊은 상세) */}
      <View style={s.footerRow}>
        <Text style={s.distance}>{distanceKm?.toFixed?.(1)}km</Text>
        <TouchableOpacity
          style={s.more}
          onPress={() => Alert.alert('자세히 보기', '여기에 더 깊은 상세를 연결하세요.')}
        >
          <Text style={s.moreText}>자세히 보기</Text>
          <Ionicons name="arrow-forward-circle-outline" size={18} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===== 프리젠테이션 조각 ===== */
function Chip({ label, type = 'filled' }) {
  if (type === 'ghost') {
    return (
      <View style={s.chipGhost}>
        <Text style={s.chipGhostText}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={s.chip}>
      <Text style={s.chipText}>{label}</Text>
    </View>
  );
}

/* ===== 스타일 ===== */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 24 },

  headerPill: {
    borderWidth: 1, borderColor: '#0BA7A6',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8,
  },
  headerPillText: { color: '#0BA7A6', fontWeight: '700' },

  card: {
    backgroundColor: '#F3F6F8',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
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

  rowWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, gap: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: {
    backgroundColor: '#14CAC9',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  chipGhost: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: '#BFD9DE',
    backgroundColor: '#fff',
  },
  chipGhostText: { color: '#2A3B44', fontWeight: '700', fontSize: 12 },

  footerRow: {
    marginTop: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  distance: { fontSize: 16, fontWeight: '800', color: '#111' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreText: { fontWeight: '700', color: '#555' },
});
