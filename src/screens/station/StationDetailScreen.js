// src/screens/station/StationDetailScreen.js
import React, { useMemo, useLayoutEffect, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

// ✅ 공통 API 헬퍼 (앞서 만든 파일)
import { fetchStationDetail, fetchStationFacilities } from '../../api/seoulApi';

// 데이터 배열
const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

/** 호선 → 색상 */
function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

/** 로컬 JSON에서 역명으로 가능한 역코드 추정 */
function getCandidateCodesByName(stationName) {
  const fields = ['stationCd', 'STATION_CD', 'station_cd', 'code', 'id']; // 있을 법한 키들
  const matches = allStations.filter((st) => st.name === stationName);
  const codes = [];
  for (const m of matches) {
    for (const k of fields) {
      if (m[k]) {
        codes.push(String(m[k]));
        break;
      }
    }
  }
  return Array.from(new Set(codes));
}

/** facilities row들을 사람이 읽기 좋은 Chip으로 변환 */
function toFacilityChips(rows = []) {
  // 스키마마다 필드명이 달라서 여러 후보를 시도
  return rows.map((r, idx) => {
    const name = r.FCLT_NM || r.FACILITY_NM || r.FACLT_NM || r.NAME || '이름없음';
    const loc  = r.LOCATION || r.POSITION || r.LCTN || r.LOC || '';
    return { id: r.FCLT_ID || r.ID || idx, label: name, location: loc };
  });
}

export default function StationDetailScreen({ route, navigation }) {
  const { stationName } = route.params ?? {};

  // 이 역이 가진 모든 호선 카드 생성 (스크린샷처럼 카드 2장 이상일 수 있음)
  const lines = useMemo(() => {
    const matches = allStations.filter((st) => st.name === stationName);
    const uniq = Array.from(new Set(matches.map((m) => m.line)));
    return uniq.length ? uniq : ['-'];
  }, [stationName]);

  const firstLine = lines[0];

  // 헤더 우측: 한눈에 보기(다른 요약/시설 화면으로 이동)
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
  }, [navigation, stationName, firstLine]);

  // 🔎 역코드 후보 (있으면 API 쿼리에 우선 사용)
  const codeCandidates = useMemo(() => getCandidateCodesByName(stationName), [stationName]);
  const primaryCode = codeCandidates[0]; // 있으면 첫 번째 코드 사용

  // 📡 API 상태
  const [detail, setDetail] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');

        // ✅ 역 상세: 코드가 있으면 코드로, 없으면 역명으로 질의
        const detailJson = await fetchStationDetail({
          start: 1,
          end: 1,
          // pathParams: [primaryCode], // 스키마가 /{code} 경로를 요구하면 이 라인 사용
          query: primaryCode
            ? { STATION_CD: primaryCode }
            : { STATION_NM: stationName }, // 필요에 따라 파라미터명을 seoulApi에서 바꿔라
        });

        // ✅ 편의시설
        const facilityJson = await fetchStationFacilities({
          start: 1,
          end: 200,
          query: primaryCode
            ? { STATION_CD: primaryCode }
            : { STATION_NM: stationName },
        });

        if (!alive) return;

        // 공통 row 추출 (seoulApi의 callSeoul에서와 같은 규칙 가정)
        const extractRows = (json) => {
          const topKey = Object.keys(json)[0];
          const payload = json[topKey];
          if (!payload || typeof payload !== 'object') return [];
          const listKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
          return listKey ? payload[listKey] : [];
        };

        const detailRows = extractRows(detailJson);
        const facilityRows = extractRows(facilityJson);

        setDetail(detailRows?.[0] ?? null);
        setFacilities(toFacilityChips(facilityRows));
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [stationName, primaryCode]);

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (err) {
    return (
      <ScrollView style={s.container} contentContainerStyle={[s.content, { gap: 12 }]}>
        <Text style={{ color: 'red' }}>오류: {err}</Text>
        <Text>데이터셋 아이디/파라미터명이 실제 스키마와 다른 경우 seoulApi 설정을 점검하세요.</Text>
      </ScrollView>
    );
  }

  // detail에서 안전하게 꺼내기
  const name = detail?.STATION_NM || detail?.STN_NM || stationName;
  const line = detail?.LINE_NM || detail?.LN_NM || firstLine || '-';
  const addr = detail?.ADDR || detail?.STN_ADDR || detail?.ADDRESS || '-';
  const phone = detail?.TEL || detail?.PHONE || '02 - XXXX - XXXX';

  // 편의시설 대표 3개 노출 + 나머지는 "준비/미설치" 처리 예시
  // 실제로는 facilityRows의 분류 필드를 참조해 필터링하는 게 가장 정확함
  const hasElev = facilities.some((f) => /엘리베이터/i.test(f.label));
  const hasEsc  = facilities.some((f) => /에스컬레이터/i.test(f.label));
  const hasNurs = facilities.some((f) => /수유실|유아|nursery/i.test(f.label));

  const missing = [];
  if (!hasElev) missing.push('엘리베이터');
  if (!hasEsc)  missing.push('에스컬레이터');
  if (!hasNurs) missing.push('수유실');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* 역별 호선 카드(여러 호선이면 여러 장) */}
      {(lines.length ? lines : ['-']).map((ln) => (
        <StationCard
          key={ln}
          stationName={name}
          line={ln}
          phone={phone}
          distanceKm={1.1} // TODO: 실제 거리 넣으려면 route.params로 전달
          addr={addr}
          chipsMain={[
            ...(hasElev ? [{ label: '엘리베이터' }] : []),
            ...(hasEsc ? [{ label: '에스컬레이터' }] : []),
            ...(hasNurs ? [{ label: '수유실' }] : []),
          ]}
          chipsGhost={missing}
          onMore={() => {
            // 더 깊은 상세 연결(예: 엘리베이터 상세 화면 혹은 지도)
            Alert.alert('자세히 보기', '여기에 더 깊은 상세를 연결하세요.');
          }}
        />
      ))}

      {/* 상세 편의시설 리스트 (상위 10건 예시) */}
      <View style={s.facSection}>
        <Text style={s.facTitle}>편의시설</Text>
        {facilities.slice(0, 10).map((f) => (
          <View key={f.id} style={s.facRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#14CAC9" />
            <Text style={s.facText}>{f.label}{f.location ? `  (${f.location})` : ''}</Text>
          </View>
        ))}
        {facilities.length > 10 && (
          <Text style={s.facMoreNote}>… 그 외 {facilities.length - 10}건 더 있음</Text>
        )}
      </View>
    </ScrollView>
  );
}

/* ===== 카드 ===== */
function StationCard({ stationName, line, phone, distanceKm, addr, chipsMain = [], chipsGhost = [], onMore }) {
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

      {/* 주소 */}
      <View style={s.row}>
        <Ionicons name="location-outline" size={18} color="#333" />
        <Text style={s.rowText}>{addr}</Text>
      </View>

      {/* 전화 */}
      <View style={s.row}>
        <Ionicons name="call-outline" size={18} color="#333" />
        <Text style={s.rowText}>{phone}</Text>
      </View>

      {/* 사용 가능 시설 */}
      {chipsMain.length > 0 && (
        <View style={s.rowWrap}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#14CAC9" />
          <View style={s.chipRow}>
            {chipsMain.map((c, idx) => <Chip key={idx} label={c.label} />)}
          </View>
        </View>
      )}

      {/* 준비/미설치 등 */}
      {chipsGhost.length > 0 && (
        <View style={s.rowWrap}>
          <Ionicons name="close-circle-outline" size={20} color="#999" />
          <View style={s.chipRow}>
            {chipsGhost.map((label, idx) => <Chip key={idx} label={label} type="ghost" />)}
          </View>
        </View>
      )}

      {/* 하단: 거리 / 자세히 보기 */}
      <View style={s.footerRow}>
        <Text style={s.distance}>{distanceKm?.toFixed?.(1)}km</Text>
        <TouchableOpacity style={s.more} onPress={onMore}>
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
  rowText: { fontSize: 15, color: '#333', flexShrink: 1 },

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

  /* 편의시설 섹션 */
  facSection: {
    marginTop: 6,
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    padding: 14,
  },
  facTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  facRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    marginBottom: 8, gap: 8,
  },
  facText: { fontSize: 14, color: '#233' },
  facMoreNote: { marginTop: 4, color: '#666' },
});
