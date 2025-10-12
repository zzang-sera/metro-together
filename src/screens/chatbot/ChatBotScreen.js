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
import { useNavigation } from "@react-navigation/native";
import { chatbotStyles as styles } from "../../styles/chatbotStyles";
import { responsiveWidth } from "../../utils/responsive";

// ✅ 로컬 JSON 데이터 (API 의존성 제거)
import elevLocalJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

// (선택) 봇 아바타
const BOT_AVATAR = require("../../assets/brand-icon.png");

// 네비는 기본 비활성화(원하면 true)
const TARGET_SCREEN = "StationDetailScreen";
const AUTO_NAVIGATE = false;

/* ---------------------- 유틸: 정규화/파서 ---------------------- */

const sanitizeName = (s = "") =>
  typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "";

const koKind = (k = "") =>
  k === "EV" ? "엘리베이터" : k === "ES" ? "에스컬레이터" : k === "WL" ? "휠체어리프트" : k || "-";

const koStatus = (v = "") =>
  v === "Y" ? "사용가능" : v === "N" ? "중지" : v || "상태미상";

const normalizeLine = (line = "") => {
  const m = String(line).match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : String(line || "");
};

// "서울역(1)" → { baseName, line }
const parseFromStationNm = (stn_nm = "") => {
  const m = String(stn_nm).match(/^(.*?)(?:\((\d+)\))?$/);
  const baseName = sanitizeName(m?.[1] ?? stn_nm);
  const line = m?.[2] ? `${parseInt(m[2], 10)}호선` : "";
  return { baseName, line };
};

// 래핑 제거
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

// 표준 스키마로 정규화
function normRow(raw) {
  const code = String(
    raw.stn_cd ?? raw.STN_CD ?? raw.station_cd ?? raw.code ?? raw.stationCode ?? ""
  ).trim();
  const stnNm = raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? raw.stationName ?? "";
  const { baseName: parsedName, line: parsedLine } = parseFromStationNm(stnNm);
  const name = parsedName;

  const facilityName = raw.elvtr_nm ?? raw.ELVTR_NM ?? raw.facilityName ?? "";
  const section = raw.opr_sec ?? raw.OPR_SEC ?? raw.section ?? "";
  const location = raw.instl_pstn ?? raw.INSTL_PSTN ?? raw.location ?? raw.gate ?? "";
  const status = koStatus(raw.use_yn ?? raw.USE_YN ?? raw.status ?? "");
  const kind = raw.elvtr_se ?? raw.ELVTR_SE ?? raw.kind ?? "";
  const line = normalizeLine(raw.line ?? raw.LINE_NUM ?? raw.lineName ?? parsedLine);
  return { code, name, facilityName, section, location, status, kind, line };
}

/* ---------------------- 사전 인덱싱 (성능↑) ---------------------- */
const ELEV_ROWS = pickArray(elevLocalJson).map(normRow);
const ELEV_BY_CODE = new Map();
const ELEV_BY_NAME = new Map();
for (const r of ELEV_ROWS) {
  if (r.code) {
    const a = ELEV_BY_CODE.get(r.code) || [];
    a.push(r);
    ELEV_BY_CODE.set(r.code, a);
  }
  if (r.name) {
    const n = sanitizeName(r.name);
    const a = ELEV_BY_NAME.get(n) || [];
    a.push(r);
    ELEV_BY_NAME.set(n, a);
  }
}

function searchLocalElev(arg) {
  const q = String(arg || "").trim();
  if (!q) return [];
  if (/^\d+$/.test(q)) return ELEV_BY_CODE.get(q) || [];
  return ELEV_BY_NAME.get(sanitizeName(q)) || [];
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
  const navigation = useNavigation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [mode, setMode] = useState(null); // 'elevAwait' | null
  const listRef = useRef(null);

  // ✅ 기본 퀵리플라이(팝업 재노출 시 여기로 복구)
  const DEFAULT_QUICK_REPLIES = [
    "가장 가까운 화장실 위치 알려줘",
    "엘리베이터 상태 조회",
  ];

  // 최초 인사
  useEffect(() => {
    appendSystem("합께타요 챗봇에 연결합니다");
    setTimeout(() => {
      appendBot("안녕하세요! 무엇을 도와드릴까요?");
      setQuickReplies(DEFAULT_QUICK_REPLIES);
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

  /* ---------- 검색 공통 ---------- */
  const runElevSearch = useCallback(
    async (query) => {
      const q = (query || "").trim();
      if (!q) {
        appendBot("역명이나 역코드를 입력해주세요. 예) 종각 / 0150");
        // 빈 입력 상황에서도 팝업 복구하는 게 UX에 좋음
        setQuickReplies(DEFAULT_QUICK_REPLIES);
        return;
      }

      setLoading(true);
      appendBot("🔎 엘리베이터 상태 조회 중…");

      const rows = searchLocalElev(q);
      console.log("[ChatBot] elev local query =", q, " → rows:", rows.length);

      if (!rows.length) {
        appendBot("⚠️ 결과가 0건입니다. 다른 입력으로 시도해보세요.");
        setLoading(false);
        // 결과 없을 때도 팝업 복구
        setQuickReplies(DEFAULT_QUICK_REPLIES);
        return;
      }

      // 요약 출력 (상위 5건)
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

      if (AUTO_NAVIGATE) {
        const first = rows[0];
        try {
          navigation.navigate(TARGET_SCREEN, {
            stationCode: first.code,
            stationName: first.name,
            line: first.line,
          });
        } catch (e) {
          console.warn("[ChatBot] navigation error:", e);
        }
      }

      setLoading(false);
      // 조회 후에도 기본 팝업 다시 띄워주면 반복 탐색에 편함 (원치 않으면 이 줄 제거)
      setQuickReplies(DEFAULT_QUICK_REPLIES);
    },
    [appendBot, navigation]
  );

  /* ---------- /elev 명령 (선택 지원) ---------- */
  const handleElevCommand = useCallback(
    async (arg) => {
      if (!arg?.trim()) {
        appendBot("사용법: /elev [역코드 또는 역명]\n예) /elev 0150  또는  /elev 종각");
        // 가이드 후 팝업 복구
        setQuickReplies(DEFAULT_QUICK_REPLIES);
        return;
      }
      await runElevSearch(arg.trim());
    },
    [runElevSearch, appendBot]
  );

  /* ---------- 명령 라우팅 ---------- */
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

  /* ---------- 전송 ---------- */
  const onSend = useCallback(
    async (text) => {
      const t = text || input.trim();
      if (!t) return;

      appendUser(t);
      setInput("");

      // 1) 역명 입력 대기 모드면 → 그냥 검색
      if (mode === "elevAwait") {
        setMode(null);
        await runElevSearch(t);
        return;
      }

      setLoading(true);

      // 2) 퀵리플라이 시나리오
      if (t.includes("엘리베이터 상태 조회")) {
        appendBot("조회할 역명을 입력해주세요. 예) 종각 / 서울대입구 / 0150");
        setMode("elevAwait");
        setLoading(false);
        return;
      }
      if (t.includes("화장실")) {
        setTimeout(() => {
          appendBot("네, 노원역에서 가장 가까운 화장실 위치를 알려드릴게요.");
        }, 300);
        setTimeout(() => {
          appendBot("", true); // 맵 placeholder
          appendBot("현재 위치 기준 북쪽 500m, 서쪽 214m에 가장 가까운 화장실이 있습니다.");
          setTimeout(() => {
            appendBot("다른 도움이 필요하신가요?");
            setQuickReplies(DEFAULT_QUICK_REPLIES);
            setLoading(false);
          }, 500);
        }, 700);
        return;
      }

      // 3) 명령 처리
      const handled = await handleCommand(t);
      if (!handled) {
        setTimeout(() => {
          appendBot(
            "알 수 없는 명령입니다.\n- 빠른 사용: \"엘리베이터 상태 조회\" → 역명 입력\n- 또는: /elev [역코드|역명]"
          );
          setLoading(false);
          // ✅ 여기! 알 수 없는 명령 이후 팝업 복구
          setQuickReplies(DEFAULT_QUICK_REPLIES); // ⬅️ 추가
        }, 300);
      }
    },
    [input, appendUser, appendBot, handleCommand, mode, runElevSearch]
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
        {/* 퀵리플라이 */}
        <View style={styles.quickReplyContainer}>
          {quickReplies.map((reply) => (
            <QuickReply key={reply} text={reply} onPress={onSend} />
          ))}
        </View>

        {/* 모드 안내 배지 */}
        {mode === "elevAwait" && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View
              style={{
                alignSelf: "flex-start",
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 9999,
                backgroundColor: "#EEFDFD",
                borderWidth: 1,
                borderColor: "#CFF5F5",
              }}
            >
              <Text style={{ color: "#0A6B6A", fontWeight: "600" }}>
                승강기 조회 모드: 역명을 입력하세요
              </Text>
            </View>
          </View>
        )}

        {/* 입력 바 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={
              mode === "elevAwait" ? "예: 종각 / 서울대입구 / 0150" : "메시지를 입력하세요."
            }
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
