// src/screens/station/FacilitiesSection.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ 내부 자동 조회에 사용할 자료들
import stationJson from '../../assets/metro-data/metro/station/data-metro-station-1.0.0.json';
import { fetchStationFacilities } from '../../api/seoulApi';

// 시설 키 상수
export const FAC = {
  ESCALATOR: 'escalator',
  ELEVATOR: 'elevator',
  ACCESSIBLE_TOILET: 'accessible_toilet',
  WHEELCHAIR_LIFT: 'wheelchair_lift',
  WIDE_GATE: 'wide_gate',            // ✅ 추천 추가
  PRIORITY_SEAT: 'priority_seat',    // (열차 내부 → 추후 분리 권장)
  NURSING: 'nursing_room',
  LOCKER: 'locker',
  AUDIO_GUIDE: 'audio_beacon',
};

// ■ 키워드 매칭 테이블 (API row의 이름/분류/설명/위치 필드에서 검색)
const MATCHERS = {
  [FAC.ESCALATOR]: [/에스컬레이터/i, /esc(alator)?/i],
  [FAC.ELEVATOR]: [/엘리베이터/i, /리프트형 엘리베이터/i, /elev/i, /lift/i],
  [FAC.ACCESSIBLE_TOILET]: [/장애인\s*화장실/i, /무장애\s*화장실/i, /accessible.*toilet/i, /restroom/i],
  [FAC.WHEELCHAIR_LIFT]: [/휠체어.*리프트/i, /wheel\s*chair.*lift/i],
  [FAC.WIDE_GATE]: [/광폭.*개찰구/i, /와이드.*게이트/i, /wide.*gate/i],
  [FAC.PRIORITY_SEAT]: [/노약자석/i, /priority.*seat/i], // (참고: 보통 차량 내 정보)
  [FAC.NURSING]: [/수유실/i, /유아.*휴게/i, /nursery|nursing room/i],
  [FAC.LOCKER]: [/물품.*보관함/i, /코인.*락커/i, /locker/i],
  [FAC.AUDIO_GUIDE]: [/음성.*유도기/i, /beacon|audio.*guide/i],
};

// ■ row에서 읽을 수 있는 필드 후보
const FIELD = {
  id: ['FCLT_ID', 'ID'],
  name: ['FCLT_NM', 'FACILITY_NM', 'FACLT_NM', 'NAME'],
  location: ['LOCATION', 'POSITION', 'LCTN', 'LOC'],
  category: ['CATEGORY', 'GUBUN', 'CLASS', 'TYPE'],
  desc: ['DESC', 'DESCRIPTION', 'ETC', 'REMARK'],
};

const allStations = stationJson.DATA;

// ■ 역명으로 로컬 JSON에서 역코드 후보 추출
function getCandidateCodesByName(stationName) {
  const codeKeys = ['stationCd', 'STATION_CD', 'station_cd', 'code', 'id'];
  const matches = allStations.filter((st) => st.name === stationName);
  const codes = [];
  for (const m of matches) {
    for (const k of codeKeys) {
      if (m[k]) {
        codes.push(String(m[k]));
        break;
      }
    }
  }
  return Array.from(new Set(codes));
}

// ■ 안전하게 필드 꺼내기
function pickField(row, keys) {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return String(row[k]);
  }
  return '';
}

// ■ API 응답에서 row 배열 추출
function extractRows(json) {
  const topKey = Object.keys(json)[0];
  const payload = json[topKey];
  if (!payload || typeof payload !== 'object') return [];
  const listKey = Object.keys(payload).find((k) => Array.isArray(payload[k]));
  return listKey ? payload[listKey] : [];
}

const moveFacilities = [
  { key: FAC.ESCALATOR, label: '에스컬레이터\n위치' },
  { key: FAC.ELEVATOR, label: '엘리베이터\n위치' },
  { key: FAC.ACCESSIBLE_TOILET, label: '장애인\n화장실 위치' },
  { key: FAC.WHEELCHAIR_LIFT, label: '휠체어\n리프트 위치' },
  { key: FAC.WIDE_GATE, label: '광폭 개찰구\n위치' },
  // { key: FAC.PRIORITY_SEAT, label: '노약자석\n위치' }, // 차량 내 정보일 가능성 높음
];

const lifeFacilities = [
  { key: FAC.NURSING, label: '수유실\n위치' },
  { key: FAC.LOCKER, label: '물품보관함\n위치' },
  { key: FAC.AUDIO_GUIDE, label: '음성유도기\n위치' },
];

export default function FacilitiesSection({
  stationName,
  fetchLocation,          // (name, key) => Promise<string>
  focusKey = null,        // ✅ 처음 선택할 키(요약화면에서 넘겨줌)
  showResult = true,      // ✅ 결과 박스 표시 여부
  onSelect,               // 선택 콜백(optional)
}) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // 내부 자동조회용: 역코드 캐시
  const primaryCode = useMemo(() => {
    if (!stationName) return undefined;
    return getCandidateCodesByName(stationName)[0];
  }, [stationName]);

  // ── 내부 자동 조회 함수: fetchLocation 미제공 시 사용 ──
  const internalFetch = async (name, key) => {
    // 1) API 호출
    const json = await fetchStationFacilities({
      start: 1,
      end: 500,
      query: primaryCode ? { STATION_CD: primaryCode } : { STATION_NM: name },
    });
    const rows = extractRows(json);

    // 2) 매칭: name/category/desc/location에서 KEY워드 찾기
    const regexes = MATCHERS[key] || [];
    const matched = rows.filter((r) => {
      const nm = pickField(r, FIELD.name);
      const cat = pickField(r, FIELD.category);
      const dc = pickField(r, FIELD.desc);
      const lc = pickField(r, FIELD.location);
      const blob = [nm, cat, dc, lc].join(' ');
      return regexes.length ? regexes.some((rx) => rx.test(blob)) : true;
    });

    if (!matched.length) {
      return `“${name}” 역의 ${labelFor(key)} 위치를 찾지 못했어요. (데이터 없음)`;
    }

    // 3) 상위 5건 요약
    const lines = matched.slice(0, 5).map((r, i) => {
      const nm = pickField(r, FIELD.name) || labelFor(key);
      const lc = pickField(r, FIELD.location);
      const dc = pickField(r, FIELD.desc);
      const segs = [nm, lc, dc].filter(Boolean);
      return `• ${segs.join(' | ')}`;
    });

    const more = matched.length > 5 ? `\n… 그 외 ${matched.length - 5}건 더 있음` : '';
    return `[${labelFor(key)} 위치]\n${lines.join('\n')}${more}`;
  };

  // 통합 핸들러
  const handlePress = async (key) => {
    setSelected(key);
    onSelect?.(key);
    setLoading(true);
    try {
      const text = await (fetchLocation
        ? fetchLocation(stationName, key)
        : internalFetch(stationName, key));
      setResult(text);
    } catch (e) {
      setResult(e?.message || '위치를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 처음 포커스 키 자동 조회
  useEffect(() => {
    if (focusKey && stationName) handlePress(focusKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, stationName, primaryCode]);

  return (
    <View style={{ gap: 16 }}>
      <Category title="이동시설">
        <TileGrid items={moveFacilities} selected={selected} onPress={handlePress} />
      </Category>

      <Category title="편의시설">
        <TileGrid items={lifeFacilities} selected={selected} onPress={handlePress} />
      </Category>

      {showResult && (
        <View style={s.resultBox}>
          {loading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator />
              <Text style={s.loadingText}>불러오는 중…</Text>
            </View>
          ) : (
            <Text style={s.resultText}>{result || '원하는 시설을 선택해 주세요.'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function Category({ title, children }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBox}>{children}</View>
    </View>
  );
}

function TileGrid({ items, selected, onPress }) {
  return (
    <View style={s.grid}>
      {items.map((it) => {
        const active = selected === it.key;
        return (
          <TouchableOpacity
            key={it.key}
            style={[s.tile, active ? s.tileActive : s.tileIdle]}
            onPress={() => onPress(it.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${labelFor(it.key)} 위치 보기`}
          >
            <Text style={s.tileIcon}>{emoji(it.key)}</Text>
            <Text style={[s.tileLabel, active ? s.labelActive : s.labelIdle]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* 유틸 */
const labelFor = (key) =>
  ({
    [FAC.ESCALATOR]: '에스컬레이터',
    [FAC.ELEVATOR]: '엘리베이터',
    [FAC.ACCESSIBLE_TOILET]: '장애인 화장실',
    [FAC.WHEELCHAIR_LIFT]: '휠체어 리프트',
    [FAC.WIDE_GATE]: '광폭 개찰구',
    [FAC.NURSING]: '수유실',
    [FAC.LOCKER]: '물품보관함',
    [FAC.AUDIO_GUIDE]: '음성유도기',
    [FAC.PRIORITY_SEAT]: '노약자석',
  }[key] || key);

const emoji = (key) =>
  ({
    [FAC.ESCALATOR]: '↗️',
    [FAC.ELEVATOR]: '🛗',
    [FAC.ACCESSIBLE_TOILET]: '🚻',
    [FAC.WHEELCHAIR_LIFT]: '♿',
    [FAC.WIDE_GATE]: '🚪',
    [FAC.NURSING]: '🍼',
    [FAC.LOCKER]: '🧳',
    [FAC.AUDIO_GUIDE]: '📢',
    [FAC.PRIORITY_SEAT]: '💺',
  }[key] || '⬜️');

/* 스타일 */
const s = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  sectionBox: { backgroundColor: '#EAF1F4', borderRadius: 16, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '30%', aspectRatio: 1, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  tileIdle: { backgroundColor: '#14CAC9' },
  tileActive: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#14CAC9' },
  tileIcon: { fontSize: 28, marginBottom: 6 },
  tileLabel: { textAlign: 'center', lineHeight: 18, fontWeight: '700' },
  labelIdle: { color: '#fff' },
  labelActive: { color: '#14CAC9' },
  resultBox: {
    backgroundColor: '#F6FAFB', borderRadius: 12, padding: 12,
    borderColor: '#E3EDF3', borderWidth: 1,
  },
  resultText: { color: '#333' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#333' },
});
