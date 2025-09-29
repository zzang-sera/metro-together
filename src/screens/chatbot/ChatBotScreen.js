import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { summarizeElevators } from '../../api/elevator';

const BOT = 'bot';
const USER = 'user';
const BOT_AVATAR = null;   // 필요하면 require('../../assets/bot.png')
const USER_AVATAR = null;  // 필요하면 require('../../assets/user.png')

export default function ChatBotScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight(); // 스택 헤더 높이 보정

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    msgBot('함께타요 챗봇에 연결합니다.'),
    msgBot('안녕하세요! 무엇을 도와드릴까요?'),
  ]);

  const listRef = useRef(null);
  const scrollToEnd = () => listRef.current?.scrollToOffset({ offset: 0, animated: true }); // inverted라 0이 끝

  const append = (...newMsgs) => {
    setMessages((prev) => {
      const next = [...prev, ...newMsgs];
      requestAnimationFrame(scrollToEnd);
      return next;
    });
  };

  const onSend = async () => {
    const q = text.trim();
    if (!q) return;
    append(msgUser(q));
    setText('');

    try {
      const lower = q.toLowerCase();
      if (lower.includes('화장실')) {
        append(
          msgBot('네, 가장 가까운 화장실 위치를 알려드릴게요.'),
          msgMapCard({ desc: '현재 위치에서 북쪽 500m, 서쪽 214m 지점입니다.' }),
          msgBot('다른 도움이 필요하신가요?')
        );
        return;
      }
      const station = extractStationName(q);
      if (lower.includes('엘리베이터') && station) {
        append(msgBot('잠시만요, 엘리베이터 위치를 확인 중입니다…'));
        setLoading(true);
        const summary = await summarizeElevators(station);
        append(msgBot(summary));
        setLoading(false);
        return;
      }
      if (station) { append(msgBot(`“${station}” 역 정보를 찾고 있어요. 엘리베이터가 맞나요?`)); return; }
      append(msgBot('예: “서울역 엘리베이터 위치 알려줘”, “가장 가까운 화장실 위치 알려줘”처럼 물어보세요.'));
    } catch (e) {
      append(msgBot(e?.message || '잠시 오류가 발생했어요.'));
      setLoading(false);
    }
  };

  // FlatList용 데이터(최신 메시지가 위에 오도록 역순) + keyExtractor
  const data = [...messages].reverse();

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight} // 스택 헤더 보정(안드 포함)
      >
        <View style={s.chatArea}>
          {/* inverted FlatList: 채팅에서 가장 안정적 */}
          <AnimatedFlatList
            ref={listRef}
            data={data}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={({ item }) =>
              item.type === 'map'
                ? <MapCard payload={item.payload} />
                : <Bubble author={item.author} text={item.text} />
            }
            contentContainerStyle={[
              s.listContent,
              { paddingBottom: 8, paddingTop: 12 },
            ]}
            onContentSizeChange={scrollToEnd}
            keyboardShouldPersistTaps="handled"
          />

          {/* 하단 입력바: 절대배치 아님! → 키보드가 올라오면 KeyboardAvoidingView가 자동으로 위로 밀어줌 */}
          <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder="메시지를 입력하세요"
              returnKeyType="send"
              onSubmitEditing={onSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity style={s.sendBtn} onPress={onSend}>
              <Text style={s.sendBtnText}>보내기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* --- 프리젠테이션 --- */
function Bubble({ author, text }) {
  const isUser = author === USER;
  return (
    <View style={[s.row, isUser ? s.rowRight : s.rowLeft]}>
      <Avatar isUser={isUser} />
      <View style={[s.bubble, isUser ? s.userBubble : s.botBubble]}>
        <Text style={s.bubbleText}>{text}</Text>
      </View>
    </View>
  );
}
function Avatar({ isUser }) {
  const source = isUser ? USER_AVATAR : BOT_AVATAR;
  if (source) return <Image source={source} style={s.avatar} />;
  return <View style={[s.avatar, { backgroundColor: isUser ? '#CCE5FF' : '#E6FFFA' }]} />;
}
function MapCard({ payload }) {
  return (
    <View style={s.mapCard}>
      <View style={s.mapPh}><Text style={{ fontWeight: '700' }}>맵</Text></View>
      <Text style={s.mapDesc}>{payload?.desc}</Text>
    </View>
  );
}

/* --- 모델/유틸 --- */
let _id = 0;
const uid = () => String(++_id);
const msgUser = t => ({ id: uid(), author: USER, type: 'text', text: t });
const msgBot = t => ({ id: uid(), author: BOT, type: 'text', text: t });
const msgMapCard = p => ({ id: uid(), author: BOT, type: 'map', payload: p });
const extractStationName = q => (q.match(/([가-힣A-Za-z0-9]+)\s*역/)?.[1] ?? null);

// 성능 좋은 기본 FlatList (애니메이션 옵션 제거해도 됨)
import { FlatList as AnimatedFlatList } from 'react-native';

/* --- 스타일 --- */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  chatArea: { flex: 1 },

  listContent: {
    paddingHorizontal: 16,
  },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },

  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E6FFFA' },

  bubble: { maxWidth: '76%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  botBubble: { backgroundColor: '#F1F5F9', borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#DFF7F7', borderTopRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: '#17171B' },

  mapCard: {
    alignSelf: 'flex-start',
    marginLeft: 36,
    backgroundColor: '#F6FAFB',
    borderRadius: 14,
    padding: 12, gap: 10,
    borderWidth: 1, borderColor: '#EDF2F7',
  },
  mapPh: { width: 220, height: 140, borderRadius: 10, backgroundColor: '#E9EEF3', alignItems: 'center', justifyContent: 'center' },
  mapDesc: { marginTop: 6, color: '#333', lineHeight: 20 },

  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  input: { flex: 1, backgroundColor: '#F7F7F9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { backgroundColor: '#14CAC9', paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700' },
});
