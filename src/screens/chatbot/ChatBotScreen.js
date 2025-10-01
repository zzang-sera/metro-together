// src/screens/chatbot/ChatBotScreen.js
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
import { Ionicons } from "@expo/vector-icons";
import { chatbotStyles as styles } from "../../styles/chatbotStyles";
import { responsiveWidth } from "../../utils/responsive";

// ✅ 로컬 JSON 데이터 (API 의존성 제거)
import elevLocalJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

// (선택) 봇 아바타
const BOT_AVATAR = require("../../assets/brand-icon.png");

/* ---------------------- 유틸: 정규화/파서 ---------------------- */

const sanitizeName = (s = "") =>
  typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";

const koKind = (k = "") =>
  k === "EV" ? "엘리베이터" : k === "ES" ? "에스컬레이터" : k === "WL" ? "휠체어리프트" : k || "-";

const koStatus = (v = "") =>
  v === "Y" ? "사용가능" : v === "N" ? "중지" : v || "상태미상";

// 로컬 JSON이 어떤 래핑을 갖더라도 배열만 뽑아내기
function pickArray(any) {
  if (Array.isArray(any)) return any;
  if (Array.isArray(any?.DATA)) return any.DATA;
  if (Array.isArray(any?.row)) return any.row;
  for (const k of Object.keys(any || {})) {
    const v = any[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray(v.row)) return v.row;
      if (Array.isArray(v.DATA)) return v.DATA;
    }
  }
  return [];
}

// 다양한 키를 표준 스키마로 정규화
function normRow(raw) {
  const code = String(
    raw.station_cd ?? raw.STN_CD ?? raw.code ?? raw.stationCode ?? ""
  ).trim();
  const name = sanitizeName(
    raw.station_nm ?? raw.STN_NM ?? raw.name ?? raw.stationName ?? ""
  );
  const facilityName = raw.elvtr_nm ?? raw.ELVTR_NM ?? raw.facilityName ?? "";
  const section = raw.opr_sec ?? raw.OPR_SEC ?? raw.section ?? "";
  const location =
    raw.instl_pstn ?? raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const status = koStatus(raw.use_yn ?? raw.USE_YN ?? raw.status ?? "");
  const kind = raw.elvtr_se ?? raw.ELVTR_SE ?? raw.kind ?? "";
  const line = String(raw.line ?? raw.LINE_NUM ?? raw.lineName ?? "").trim();
  return { code, name, facilityName, section, location, status, kind, line };
}

// 로컬 폴백 검색
function searchLocalElev(arg) {
  const arr = pickArray(elevLocalJson).map(normRow);
  const isCode = /^\d+$/.test(arg);
  if (isCode) return arr.filter((r) => r.code === arg);
  const n = sanitizeName(arg);
  return arr.filter((r) => sanitizeName(r.name) === n);
}

/* ---------------------- UI 파츠 ---------------------- */

const QuickReply = ({ text, onPress }) => (
  <TouchableOpacity style={styles.quickReplyButton} onPress={() => onPress(text)}>
    <Text style={styles.quickReplyText}>{text}</Text>
  </TouchableOpacity>
);

const MessageBubble = ({ item }) => {
  if (item.role === "system") {
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
    );
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
            <Text style={[styles.messageText, styles.botText]}>{item.text}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

/* ---------------------- 메인 ---------------------- */

export default function ChatBotScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const listRef = useRef(null);

  // 최초 인사
  useEffect(() => {
    appendSystem("합께타요 챗봇에 연결합니다");
    setTimeout(() => {
      appendBot("안녕하세요! 무엇을 도와드릴까요?");
      setQuickReplies(["가장 가까운 화장실 위치 알려줘", "엘리베이터 상태 조회"]);
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const append = useCallback((role, item) => {
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), role, ...item },
    ]);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
  }, []);
  const appendUser = useCallback(
    (text) => {
      append("user", { text });
      setQuickReplies([]); // 입력하면 퀵리플라이 숨김
    },
    [append]
  );
  const appendBot = useCallback((text, isMap = false) => append("bot", { text, isMap }), [append]);
  const appendSystem = useCallback((text) => append("system", { text }), [append]);

  /* ---------- /elev 명령핸들러 (로컬 JSON 전용) ---------- */
  const handleElevCommand = useCallback(
    async (arg) => {
      const q = (arg || "").trim();
      if (!q) {
        appendBot("사용법: /elev [역코드 또는 역명]\n예) /elev 0150  또는  /elev 종각");
        return;
      }

      setLoading(true);
      appendBot("🔎 엘리베이터 상태 조회 중…");

      const rows = searchLocalElev(q);

      if (!rows.length) {
        appendBot("⚠️ 결과가 0건입니다. 다른 입력으로 시도해보세요.");
        setLoading(false);
        return;
      }

      // 보기 좋게 요약 출력 (상위 5건)
      const head = rows.slice(0, 5);
      const lines = head.map((r, i) => {
        const nm = r.name || "역명정보없음";
        const loc = r.location || "-";
        const st = r.status || "상태미상";
        const kd = koKind(r.kind);
        const ln = r.line ? ` · ${r.line}` : "";
        const sec = r.section ? ` | 구간: ${r.section}` : "";
        return `#${i + 1} ${nm} (${r.code})${ln}\n   • ${kd} | ${st}\n   • 위치: ${loc}${sec}`;
      });
      const more = rows.length > head.length ? `\n…외 ${rows.length - head.length}건` : "";
      appendBot(`조회결과\n${lines.join("\n\n")}${more}`);

      setLoading(false);
    },
    [appendBot]
  );

  /* ---------------------- 명령 라우팅 ---------------------- */
  const handleCommand = useCallback(
    async (text) => {
      const msg = text.trim();
      if (msg.startsWith("/elev")) {
        const arg = msg.replace(/^\/elev\s*/i, "");
        await handleElevCommand(arg);
        return true;
      }
      return false;
    },
    [handleElevCommand]
  );

  /* ---------------------- 전송 ---------------------- */
  const onSend = useCallback(
    async (text) => {
      const t = text || input.trim();
      if (!t) return;

      appendUser(t);
      setInput("");
      setLoading(true);

      // 퀵리플라이 시나리오
      if (t.includes("엘리베이터 상태 조회")) {
        setTimeout(() => {
          appendBot(
            "/elev [역코드 또는 역명] 으로 엘리베이터 상태를 조회해보세요.\n예) /elev 0150  또는  /elev 종각"
          );
          setLoading(false);
        }, 600);
        return;
      }
      if (t.includes("화장실")) {
        setTimeout(() => {
          appendBot("네, 노원역에서 가장 가까운 화장실 위치를 알려드릴게요.");
          setTimeout(() => {
            appendBot("", true); // 맵 placeholder
            appendBot("현재 위치 기준 북쪽 500m, 서쪽 214m에 가장 가까운 화장실이 있습니다.");
            setTimeout(() => {
              appendBot("다른 도움이 필요하신가요?");
              setQuickReplies(["엘리베이터 상태 조회", "다른 역 화장실 찾기"]);
              setLoading(false);
            }, 800);
          }, 800);
        }, 600);
        return;
      }

      // 명령 처리
      const handled = await handleCommand(t);
      if (!handled) {
        setTimeout(() => {
          appendBot("알 수 없는 명령입니다. 사용 가능: /elev [역코드 또는 역명]");
          setLoading(false);
        }, 500);
      }
    },
    [input, appendUser, appendBot, handleCommand]
  );

  /* ---------------------- 렌더 ---------------------- */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => onSend()}
            disabled={loading}
          >
            <Ionicons
              name="send"
              size={responsiveWidth(24)}
              color={input.trim() ? "#17171B" : "#14CAC9"}
            />
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
