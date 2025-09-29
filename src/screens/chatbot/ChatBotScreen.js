// src/screens/chatbot/ChatBotScreen.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  KeyboardAvoidingView, // RN 기본 컴포넌트 사용
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

const initialMessages = [
  { id: 'm1', from: 'bot', text: '함께타요 챗봇에 연결합니다.' },
  { id: 'm2', from: 'bot', text: '안녕하세요! 무엇을 도와드릴까요?' },
];

export default function ChatBotScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const listRef = useRef(null);

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: `u-${Date.now()}`, from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botMsg = {
        id: `b-${Date.now()}`,
        from: 'bot',
        text: `“${text}” 관련 정보를 준비 중이에요.`,
      };
      setMessages(prev => [...prev, botMsg]);
    }, 300);
  }, [input]);

  // 새 메시지 생기면 항상 맨 아래로
  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages]);

  // iOS만 키보드 회피(헤더 높이만큼 오프셋)
  const Wrapper = ({ children }) =>
    Platform.OS === 'ios' ? (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {children}
      </KeyboardAvoidingView>
    ) : (
      <>{children}</>
    );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <Wrapper>
        {/* 채팅 목록: 일반 방향(위→아래), 입력바 높이만큼 큰 패딩 불필요 */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Bubble from={item.from} text={item.text} />}
          contentContainerStyle={[s.listContent, { paddingBottom: 12 }]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
          }
          style={{ flex: 1 }}
        />

        {/* 입력바: 일반 레이아웃(absolute 아님) → 키보드/탭바와 공백 없음 */}
        <View style={[s.footer, { paddingBottom: Math.max(8, insets.bottom) }]}>
          <View style={s.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="메시지를 입력하세요"
              style={s.input}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <TouchableOpacity style={s.sendBtn} onPress={send} activeOpacity={0.9}>
              <Text style={s.sendText}>보내기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Wrapper>
    </SafeAreaView>
  );
}

function Bubble({ from, text }) {
  const isUser = from === 'user';
  return (
    <View style={[s.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      {!isUser && <View style={s.avatar} />}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
        <Text style={[s.bubbleText, isUser ? s.textUser : s.textBot]}>{text}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DFF6F6', marginRight: 8 },

  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { backgroundColor: '#E9F1F6' },
  bubbleUser: { backgroundColor: '#14CAC9' },

  bubbleText: { fontSize: 16, lineHeight: 22 },
  textBot: { color: '#1A1A1A' },
  textUser: { color: '#fff', fontWeight: '600' },

  // ✅ 절대배치 제거: 일반 레이아웃으로 바닥에 고정
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eaeaea',
    paddingHorizontal: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F2F4F6',
    fontSize: 16,
  },
  sendBtn: {
    marginLeft: 10,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#14CAC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
