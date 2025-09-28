import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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

const moveFacilities = [
  { key: FAC.ESCALATOR, label: '에스컬레이터\n위치' },
  { key: FAC.ELEVATOR, label: '엘리베이터\n위치' },
  { key: FAC.ACCESSIBLE_TOILET, label: '장애인\n화장실 위치' },
  { key: FAC.WHEELCHAIR_LIFT, label: '휠체어\n리프트 위치' },
  { key: FAC.WIDE_GATE, label: '광폭 개찰구\n위치' },
  // { key: FAC.PRIORITY_SEAT, label: '노약자석\n위치' },
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

  useEffect(() => {
    if (focusKey) handlePress(focusKey); // 처음에 자동 선택/조회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, stationName]);

  const handlePress = async (key) => {
    setSelected(key);
    onSelect?.(key);
    try {
      const text = await (fetchLocation
        ? fetchLocation(stationName, key)
        : Promise.resolve(`"${stationName}" 역의 ${labelFor(key)}는 개찰구 근처에 있어요.`));
      setResult(text);
    } catch (e) {
      setResult(e?.message || '위치를 불러오지 못했습니다.');
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <Category title="이동시설">
        <TileGrid items={moveFacilities} selected={selected} onPress={handlePress} />
      </Category>

      <Category title="편의시설">
        <TileGrid items={lifeFacilities} selected={selected} onPress={handlePress} />
      </Category>

      {showResult && !!result && (
        <View style={s.resultBox}><Text style={s.resultText}>{result}</Text></View>
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
});
