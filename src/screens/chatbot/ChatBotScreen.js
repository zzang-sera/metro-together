<<<<<<< HEAD
import React, { useState, useCallback, useRef, useEffect } from "react";
=======
// src/screens/chatbot/ChatBotScreen.js
import React, { useState } from "react";
>>>>>>> 9f3d704 (csv, JSON 파일 추가)
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
<<<<<<< HEAD
=======
  StyleSheet,
>>>>>>> 9f3d704 (csv, JSON 파일 추가)
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
<<<<<<< HEAD
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
=======
import { useNavigation } from "@react-navigation/native";
import { getElevByCode, getElevByName, prettify } from "../../api/elevClient";
>>>>>>> 9f3d704 (csv, JSON 파일 추가)

export default function ChatBotScreen() {
  const navigation = useNavigation();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
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
=======

  // 최근 검색 결과(여러 건일 때 /pick으로 선택)
  const [lastRows, setLastRows] = useState([]);

  const pushUser = (text) =>
    setMessages((prev) => [...prev, { role: "user", text }]);
  const pushBot = (text) =>
    setMessages((prev) => [...prev, { role: "bot", text }]);

  // StationFacilities로 이동 (표준키로 전달)
  function goSFS(row) {
    const nameRaw = row.stationName ?? row.name ?? row.title ?? "";
    const lineRaw = row.line ?? row.lineName ?? row.route ?? row.ln ?? "";
    const codeRaw = row.stationCode ?? row.code ?? row.id ?? null;

    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
    const line = typeof lineRaw === "string" ? lineRaw.trim() : "";
    const code = typeof codeRaw === "string" ? codeRaw.trim() : codeRaw;

    console.log(
      `DEBUG SFS: 2025-09-30-v1 params: code=${code ?? "null"} name=${name || '""'} line=${line || '""'}`
    );

    navigation.navigate("StationFacilities", {
      code: code ?? null,
      name,
      line,
    });
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    pushUser(input);
    setInput("");
    setLoading(true);

    try {
      // ----- /pick n : 최근 목록에서 선택 이동 -----
      if (/^\/pick\s+\d+$/i.test(trimmed)) {
        const n = parseInt(trimmed.split(/\s+/)[1], 10);
        if (!lastRows.length) {
          pushBot("⚠️ 선택할 목록이 없습니다. 먼저 `/elev 역명`으로 검색해 주세요.");
        } else if (n < 1 || n > lastRows.length) {
          pushBot(`⚠️ 1부터 ${lastRows.length} 사이의 번호를 선택하세요. 예) /pick 1`);
        } else {
          const chosen = lastRows[n - 1];
          pushBot(
            `✅ 이동: ${chosen.stationName ?? chosen.name ?? "-"} (${chosen.stationCode ?? chosen.code ?? "-"})`
          );
          goSFS(chosen);
        }
        return;
      }

      // ----- /elev ... : 역명/코드 조회 -----
      if (trimmed.startsWith("/elev")) {
        const parts = trimmed.split(" ");
        const codeOrName = parts[1]?.trim();

        if (!codeOrName) {
          pushBot('⚠️ 역 코드나 역명을 입력하세요. 예) `/elev 0158` 또는 `/elev 종각`');
          return;
        }

        const isCode = /^\d+$/.test(codeOrName);
        const result = isCode
          ? await getElevByCode(codeOrName)
          : await getElevByName(codeOrName);

        if (!result.ok) {
          pushBot(`❌ 오류: ${result.error || "데이터를 불러오지 못했습니다."}`);
          setLastRows([]);
          return;
        }
        const rows = result.rows || [];
        if (!rows.length) {
          pushBot("⚠️ 데이터가 없습니다. 역명/역코드를 확인해주세요.");
          setLastRows([]);
          return;
        }

        // 1건이면 바로 디테일 표시 + 화면 이동
        if (rows.length === 1) {
          const r = rows[0];
          pushBot(prettify([r]));
          goSFS(r);
          setLastRows([r]);
          return;
        }

        // 여러 건이면 목록 제공 + /pick 유도
        setLastRows(rows);
        const list = rows
          .map((r, idx) => {
            const name = r.name ?? r.stationName ?? "-";
            const code = r.code ?? r.stationCode ?? "-";
            const line = r.line ?? r.lineName ?? "-";
            const kind =
              r.kind === "EV" ? "엘리베이터" : r.kind === "ES" ? "에스컬레이터" : r.kind || "-";
            const status = r.status ?? "-";
            return `${idx + 1}. ${name} (${code}) [${line}] • ${kind} • ${status}`;
          })
          .join("\n");
        pushBot(`🔎 검색 결과 ${rows.length}건\n\n${list}\n\n원하는 항목으로 이동하려면 \`/pick 번호\` 를 입력하세요. 예) \`/pick 1\``);
        return;
      }

      // ----- 일반 입력: 가이드 -----
      pushBot(
        `👋 "${trimmed}" 라고 하셨네요.\n` +
          '지하철 보조 명령은 이렇게 사용해요:\n' +
          '• `/elev 역명` 예) `/elev 종각`\n' +
          '• `/elev 코드` 예) `/elev 0158`\n' +
          '여러 건이 나오면 `/pick 번호` 로 선택하면 됩니다.'
      );
>>>>>>> 9f3d704 (csv, JSON 파일 추가)
    } catch (e) {
      pushBot("⚠️ 네트워크 오류: " + (e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
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
=======
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        <FlatList
          data={messages}
          keyExtractor={(_, idx) => String(idx)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View
              style={[
                s.msgBubble,
                item.role === "user" ? s.userBubble : s.botBubble,
              ]}
            >
              <Text style={s.msgText}>{item.text}</Text>
            </View>
          )}
        />
        {loading && <ActivityIndicator style={{ marginBottom: 8 }} />}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="메시지를 입력하세요..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>전송</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  msgBubble: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userBubble: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  botBubble: { backgroundColor: "#F1F0F0", alignSelf: "flex-start" },
  msgText: { fontSize: 15, color: "#222" },
  inputRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ddd",
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#14CAC9",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
>>>>>>> 9f3d704 (csv, JSON 파일 추가)
