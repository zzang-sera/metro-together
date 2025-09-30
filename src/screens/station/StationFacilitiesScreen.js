// src/screens/station/StationFacilitiesScreen.js
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import lineJson from '../../assets/metro-data/metro/line/data-metro-line-1.0.0.json';

// ✅ 공통 API 헬퍼 (seoulApi.js에서 데이터셋/파라미터를 실제 스키마에 맞춰놔야 함)
import { fetchStationFacilities } from '../../api/seoulApi';

const allStations = stationJson.DATA;
const lineData = lineJson.DATA;

/** 라인 → 색상 */
function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : '#666666';
}

/** 역명으로 로컬 JSON에서 역코드 후보 추출 */
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

/** API row를 뷰모델로 변환 */
function toFacilityItem(row, idx) {
  const id = row.FCLT_ID || row.ID || idx;
  const name = row.FCLT_NM || row.FACILITY_NM || row.FACLT_NM || row.NAME || '이름없음';
  const loc  = row.LOCATION || row.POSITION || row.LCTN || row.LOC || '';
  const cat  = row.CATEGORY || row.GUBUN || row.CLASS || ''; // 분류가 있으면 그룹화에 사용
  return { id, name, location: loc, category: cat };
}

/** 카테고리별 그룹화 (없으면 '기타') */
function groupByCategory(items) {
  const map = new Map();
  items.forEach((it) => {
    const key = it.category || '기타';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  });
  // 보기 좋게 카테고리 정렬(엘리베이터/에스컬레이터가 앞으로 오도록 살짝 가중치)
  const orderScore = (k) => {
    if (/엘리베이터/i.test(k)) return 0;
    if (/에스컬레이터/i.test(k)) return 1;
    if (/장애|무장애|배리어/i.test(k)) return 2;
    return 10;
  };
  return [...map.entries()]
    .sort((a, b) => orderScore(a[0]) - orderScore(b[0]) || a[0].localeCompare(b[0]))
    .map(([category, arr]) => ({ category, items: arr }));
}

/* ─────────────────────────────────────────────
   네트워크/서울API 진단용 패널
   - HTTPS 외부요청(JSONPlaceholder)
   - 서울 OpenAPI 핑
   - 실제 시설 API 호출 테스트
────────────────────────────────────────────── */
function DebugNetworkPanel({ stationName }) {
  const [open, setOpen] = useState(true);
  const [msg1, setMsg1] = useState('대기 중');
  const [msg2, setMsg2] = useState('대기 중');
  const [msg3, setMsg3] = useState('대기 중');

  const testJSONPlaceholder = useCallback(async () => {
    setMsg1('요청 중…');
    try {
      const r = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      const j = await r.json();
      console.log('[TEST OK] jsonplaceholder', j);
      setMsg1('성공: HTTPS 외부 요청 정상');
    } catch (e) {
      console.warn('[TEST FAIL] jsonplaceholder', e);
      setMsg1('실패: HTTPS 테스트 실패 (네트워크/프록시/에뮬레이터 확인)');
    }
  }, []);

  const testSeoulPing = useCallback(async () => {
    setMsg2('요청 중…');
    try {
      const r = await fetch('https://openapi.seoul.go.kr:8088/', { method: 'GET' });
      console.log('[SEOUL PING]', r.status, r.statusText);
      setMsg2(`접속 시도: status ${r.status} (${r.statusText || 'OK'})`);
    } catch (e) {
      console.warn('[SEOUL PING FAIL]', e);
      setMsg2('실패: 서울 API HTTPS 접근 실패 (HTTP로 전환 + usesCleartextTraffic 필요 가능)');
    }
  }, []);

  const testFacilitiesAPI = useCallback(async () => {
    setMsg3('요청 중…');
    try {
      const json = await fetchStationFacilities({
        start: 1,
        end: 5,
        // ⚠️ seoulApi.js의 파라미터 맵에 맞춰 조정
        query: stationName ? { STATION_NM: stationName } : { STATION_CD: '0150' },
      });
      const topKey = Object.keys(json)[0];
      const payload = json[topKey] || {};
      const listKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
      const rows = listKey ? payload[listKey] : [];
      console.log('[SEOUL FAC OK] rows:', rows.slice(0, 2));
      if (payload.RESULT?.CODE && payload.RESULT.CODE !== 'INFO-000') {
        setMsg3(`응답 에러: ${payload.RESULT.CODE} ${payload.RESULT.MESSAGE || ''}`);
      } else if (!rows.length) {
        setMsg3('성공(데이터 0건): 파라미터/역명/코드 확인 필요');
      } else {
        setMsg3(`성공: ${rows.length}건 수신 (상위 2건 콘솔 출력)`);
      }
    } catch (e) {
      console.warn('[SEOUL FAC FAIL]', e);
      setMsg3(`실패: ${e?.message || e}`);
    }
  }, [stationName]);

  // 화면 들어오면 1번만 자동 HTTPS 테스트
  useEffect(() => {
    testJSONPlaceholder();
  }, [testJSONPlaceholder]);

  return (
    <View style={s.debugBox}>
      <TouchableOpacity onPress={() => setOpen(v => !v)} style={s.debugHeader}>
        <Text style={s.debugTitle}>디버그 · 네트워크 점검</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#333" />
      </TouchableOpacity>
      {open && (
        <View style={{ gap: 8 }}>
          <View style={s.debugRow}>
            <TouchableOpacity style={s.debugBtn} onPress={testJSONPlaceholder}>
              <Text style={s.debugBtnText}>HTTPS 테스트</Text>
            </TouchableOpacity>
            <Text style={s.debugMsg}>{msg1}</Text>
          </View>
          <View style={s.debugRow}>
            <TouchableOpacity style={s.debugBtn} onPress={testSeoulPing}>
              <Text style={s.debugBtnText}>서울 API 핑</Text>
            </TouchableOpacity>
            <Text style={s.debugMsg}>{msg2}</Text>
          </View>
          <View style={s.debugRow}>
            <TouchableOpacity style={s.debugBtn} onPress={testFacilitiesAPI}>
              <Text style={s.debugBtnText}>시설 API 호출</Text>
            </TouchableOpacity>
            <Text style={s.debugMsg}>{msg3}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function StationFacilitiesScreen({ route }) {
  const { stationName, line } = route.params ?? {};
  const title = useMemo(() => {
    if (!stationName) return '시설';
    return line ? `${stationName} (${line})` : stationName;
  }, [stationName, line]);

  // 라인 배지 색
  const lineColor = useMemo(() => (line ? getLineColor(line) : '#BFD9DE'), [line]);

  // 역코드 후보
  const codeCandidates = useMemo(
    () => (stationName ? getCandidateCodesByName(stationName) : []),
    [stationName],
  );
  const primaryCode = codeCandidates[0];

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');

        // 실제 스키마에 맞춰 STATION_CD / STATION_NM 등으로 조회
        const json = await fetchStationFacilities({
          start: 1,
          end: 500, // 필요 시 더 늘리거나 페이징
          query: primaryCode
            ? { STATION_CD: primaryCode }
            : { STATION_NM: stationName },
        });

        // 표준 row 추출
        const extractRows = (j) => {
          const topKey = Object.keys(j)[0];
          const payload = j[topKey];
          if (!payload || typeof payload !== 'object') return [];
          const listKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
          return listKey ? payload[listKey] : [];
        };

        const rows = extractRows(json);
        const items = rows.map(toFacilityItem);
        const grouped = groupByCategory(items);

        if (!alive) return;
        setGroups(grouped);
      } catch (e) {
        if (!alive) return;
        const msg = String(e?.message || e);
        // 친절한 에러 문구 분기
        if (/Network request failed/i.test(msg)) {
          setErr('네트워크 연결 또는 HTTP/HTTPS 정책 문제로 요청이 차단되었습니다.');
        } else if (/INFO-200/i.test(msg)) {
          setErr('요청 결과가 없습니다. 역명/역코드를 확인해주세요.');
        } else {
          setErr(msg);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [stationName, primaryCode]);

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* 네트워크 진단 패널 */}
      <DebugNetworkPanel stationName={stationName} />

      {/* 헤더 */}
      <View style={s.headerRow}>
        {line ? (
          <View style={[s.lineBadge, { borderColor: lineColor }]}>
            <Text style={[s.lineBadgeText, { color: lineColor }]}>{line}</Text>
          </View>
        ) : null}
        <Text style={s.header}>{title}</Text>
      </View>

      {/* 에러 메시지 */}
      {err ? <Text style={s.error}>오류: {err}</Text> : null}

      {/* 결과 없음 */}
      {!err && groups.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="help-circle-outline" size={22} color="#999" />
          <Text style={s.empty}>표시할 편의시설이 없습니다.</Text>
        </View>
      ) : null}

      {/* 목록 */}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.category}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item: group }) => (
          <View style={s.groupCard}>
            <Text style={s.groupTitle}>{group.category}</Text>
            {group.items.map((it) => (
              <View key={it.id} style={s.row}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#14CAC9" />
                <Text style={s.rowText}>
                  {it.name}{it.location ? `  (${it.location})` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16 },

  // 디버그 패널
  debugBox: { backgroundColor: '#F6FAFB', borderRadius: 12, padding: 10, borderColor: '#E3EDF3', borderWidth: 1, marginBottom: 10 },
  debugHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  debugTitle: { fontWeight: '800', color: '#222' },
  debugRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  debugBtn: { backgroundColor: '#14CAC9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  debugBtnText: { color: '#fff', fontWeight: '700' },
  debugMsg: { flex: 1, color: '#333' },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  lineBadge: {
    borderWidth: 1.5, borderColor: '#0BA7A6',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, marginRight: 10, backgroundColor: '#fff',
  },
  lineBadgeText: { fontSize: 13, fontWeight: '800' },
  header: { fontSize: 20, fontWeight: '700', color: '#111' },

  error: { color: 'red', marginBottom: 8 },

  emptyWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  empty: { color: '#666' },

  groupCard: {
    backgroundColor: '#F8FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  groupTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    marginBottom: 8, gap: 8,
  },
  rowText: { fontSize: 14, color: '#233', flexShrink: 1 },
});
