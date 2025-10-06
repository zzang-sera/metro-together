import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Constants from "expo-constants";
import { getElevStatus } from "../../api/seoulElev";
import { chatbotStyles as styles } from '../../styles/chatbotStyles';
import { responsiveWidth, responsiveHeight } from '../../utils/responsive';

const SEOUL_KEY = Constants.expoConfig?.extra?.SEOUL_KEY;
const BOT_AVATAR = require('../../assets/brand-icon.png'); 

const QuickReply = ({ text, onPress }) => (
  <TouchableOpacity style={styles.quickReplyButton} onPress={() => onPress(text)}>
    <Text style={styles.quickReplyText}>{text}</Text>
  </TouchableOpacity>
);

const MessageBubble = ({ item }) => {
  if (item.role === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      </View>
    );
  }

  const isBot = item.role === "bot";

  if (!isBot) {
    return (
      <View style={[styles.messageRow, styles.userMessageRow]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.messageRow, styles.botMessageRow]}>
      <View style={styles.avatarContainer}>
        <Image source={BOT_AVATAR} style={styles.avatar} />
        <Text style={styles.botName}>합께타요</Text>
      </View>
      <View style={styles.botBubbleContainer}>
        <View style={[styles.bubble, styles.botBubble]}>
          {item.isMap ? (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>맵</Text>
            </View>
          ) : (
            <Text style={[styles.messageText, styles.botText]}>
              {item.text}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ChatBotScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    appendSystem("합께타요 챗봇에 연결합니다");
    setTimeout(() => {
      appendBot("안녕하세요! 무엇을 도와드릴까요?");
      setQuickReplies(["가장 가까운 화장실 위치 알려줘", "엘리베이터 상태 조회"]);
    }, 1000);
  }, []);

  const append = useCallback((role, item) => {
    setMessages(prev => [...prev, { id: String(Date.now() + Math.random()), role, ...item }]);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
  }, []);

  const appendUser = useCallback((text) => {
    append("user", { text });
    setQuickReplies([]); 
  }, [append]);

  const appendBot = useCallback((text, isMap = false) => {
    append("bot", { text, isMap });
  }, [append]);

  const appendSystem = useCallback((text) => append("system", { text }), [append]);

  const handleElevCommand = useCallback(async (arg) => {
    setLoading(true);
    if (!SEOUL_KEY) {
      appendBot("⚠️ SEOUL_KEY가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }
    if (!arg) {
      appendBot("사용법: /elev [역코드 또는 역명]\n예) /elev 0150  또는  /elev 종각");
      setLoading(false);
      return;
    }
    
    appendBot("🔎 엘리베이터 상태 조회 중…");

    try {
      const { ok, rows, meta, error } = await getElevStatus(SEOUL_KEY, arg, { start: 1, end: 50 });
      if (!ok) {
        if (error === "NO_DATA_OR_SERVER") appendBot("⚠️ 데이터가 없습니다. 역명/역코드를 확인해주세요.");
        else appendBot(`⚠️ 오류: ${String(error)}`);
        return;
      }
      if (!Array.isArray(rows) || rows.length === 0) {
        appendBot("결과가 0건입니다. 다른 입력으로 시도해보세요.");
        return;
      }
      const preview = rows.slice(0, 3).map((r, i) => {
        const stName = r.STATION_NM || "역명정보없음";
        const status = r.STATUS || "상태미상";
        const place  = r.LOCATION || "";
        return `#${i + 1} ${stName} ${place}  •  상태: ${status}`;
      });
      const more = rows.length > 3 ? `\n…외 ${rows.length - 3}건` : "";
      appendBot(`조회결과:\n${preview.join("\n")}${more}`);
    } catch (e) {
      appendBot(`⚠️ 네트워크/서버 오류: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, [appendBot]);

  const handleCommand = useCallback(async (text) => {
    const msg = text.trim();
    if (msg.startsWith("/elev")) {
      const arg = msg.replace(/^\/elev\s*/i, "");
      await handleElevCommand(arg);
      return true;
    }
    return false;
  }, [handleElevCommand]);

  const onSend = useCallback(async (text) => {
    const t = text || input.trim();
    if (!t) return;

    appendUser(t);
    setInput("");
    setLoading(true);

    if (t.includes("엘리베이터 상태 조회")) {
      setTimeout(() => {
        appendBot("/elev [역코드 또는 역명] 으로 엘리베이터 상태를 조회해보세요.\n예) /elev 0150 또는 /elev 종각");
        setLoading(false);
      }, 1000);
      return;
    }
    
    if (t.includes("화장실")) {
      setTimeout(() => {
        appendBot("네, 노원역에서 가장 가까운 화장실 위치를 알려드리겠습니다.");
        setTimeout(() => {
          appendBot("", true);
          appendBot("가장 가까운 화장실 위치는 현재 위치에서 북쪽으로 500m, 서쪽으로 214m 위치에 있습니다.");
          setTimeout(() => {
            appendBot("다른 도움이 필요하신가요?");
            setQuickReplies(["엘리베이터 상태 조회", "다른 역 화장실 찾기"]);
            setLoading(false);
          }, 1000);
        }, 1500);
      }, 1000);
      return;
    }

    const handled = await handleCommand(t);
    if (!handled) {
      setTimeout(() => {
        appendBot("명령을 인식하지 못했어요. 사용 가능한 명령: /elev [역코드 또는 역명]");
        setLoading(false);
      }, 1000);
    }
  }, [input, appendUser, appendBot, handleCommand]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.chatListContent}
      />

      <View>
        <View style={styles.quickReplyContainer}>
          {quickReplies.map((reply) => (
            <QuickReply key={reply} text={reply} onPress={onSend} />
          ))}
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요."
            placeholderTextColor="#17171B"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => onSend()}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => onSend()} disabled={loading}>
            <Ionicons name="send" size={responsiveWidth(24)} color={input.trim() ? '#17171B' : '#14CAC9'} />
          </TouchableOpacity>
        </View>
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#14CAC9" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}