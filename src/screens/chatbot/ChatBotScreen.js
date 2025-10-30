// src/screens/chatbot/ChatBotScreen.js
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createChatbotStyles } from "../../styles/chatbotStyles";
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";

import { fetchSubwayPath } from "../pathfinder/PathFinderScreen"; // 경로 API 재사용
import BarrierFreeMapMini from "../../components/BarrierFreeMapMini";

// 엘리베이터 로컬 JSON (기존 기능 유지)
import elevLocalJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";

// ✅ 역 지도 이미지 매핑 JSON (네가 보낸 구조)
import stationImages from "../../assets/metro-data/metro/station/station_images.json";

const BOT_AVATAR = require("../../assets/brand-icon.png");

/* ---------------------- 유틸 ---------------------- */
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
const parseFromStationNm = (stn_nm = "") => {
  const m = String(stn_nm).match(/^(.*?)(?:\((\d+)\))?$/);
  const baseName = sanitizeName(m?.[1] ?? stn_nm);
  const line = m?.[2] ? `${parseInt(m[2], 10)}호선` : "";
  return { baseName, line };
};
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

/* ---------------------- 엘리베이터 인덱싱 (기존 유지) ---------------------- */
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

/* ---------------------- 역명 정규화 & 이미지 URL 선택 ---------------------- */
function normalizeStationName(name) {
  return String(name || "")
    .replace(/\(.*?\)/g, "") // (4호선) 제거
    .replace(/역\s*$/u, "")  // '역' 접미사 제거
    .trim();
}

/**
 * station_images.json(DATA 배열)에서 이미지 링크를 고른다.
 * - 역명 일치(청량리 vs 청량리역 모두 OK)
 * - (선택) 호선 우선: 동일 역 다수 이미지면 sbwy_rout_ln == preferLine을 우선
 * - 없으면 seq가 가장 작은(먼저 나오는) 이미지 선택
 *
 * @param {string} stationName 입력 역명
 * @param {string|number|null} preferLine 우선 호선 (예: "1" | 1), 없으면 무시
 * @returns {string|null} img_link
 */
function getMapImageUrlFromJson(stationName, preferLine = null) {
  const data = stationImages?.DATA;
  if (!Array.isArray(data)) return null;

  const key = normalizeStationName(stationName);

  // 후보: sttn이 "청량리역" 또는 "청량리" 포함/정규화 일치 (데이터는 보통 "청량리역" 형태)
  const candidates = data.filter((it) => {
    const raw = String(it.sttn || it.STTN || "").trim();
    const norm = normalizeStationName(raw);
    return norm === key || raw === stationName || raw === `${key}역`;
  });

  if (candidates.length === 0) return null;

  // 호선 우선 (sbwy_rout_ln는 문자열 "1" 같은 형태)
  let picked = null;
  if (preferLine != null) {
    const lineStr = String(preferLine).replace(/호선$/, "");
    const byLine = candidates.filter((it) => String(it.sbwy_rout_ln) === lineStr);
    if (byLine.length > 0) {
      // seq 오름차순
      byLine.sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999));
      picked = byLine[0];
    }
  }
  // 없으면 seq 가장 작은 것
  if (!picked) {
    candidates.sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999));
    picked = candidates[0];
  }

  const link = picked?.img_link || picked?.IMG_LINK;
  return typeof link === "string" && link.length > 0 ? link : null;
}

/* ---------------------- 메인 ---------------------- */
export default function ChatBotScreen() {
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [mode, setMode] = useState(null); // "elevAwait" | "pathStartAwait" | "pathEndAwait" | null
  const [pathStart, setPathStart] = useState("");
  const [lastPathEnd, setLastPathEnd] = useState("노원");
  const listRef = useRef(null);

  const styles = useMemo(() => createChatbotStyles(fontOffset), [fontOffset]);

  const DEFAULT_QUICK_REPLIES = [
    "가장 가까운 화장실 위치 알려줘",
    "엘리베이터 상태 조회",
    "지하철 최단 경로",
  ];

  useEffect(() => {
    appendSystem("함께타요 챗봇에 연결합니다");
    setTimeout(() => {
      appendBot("안녕하세요! 무엇을 도와드릴까요?");
      setQuickReplies(DEFAULT_QUICK_REPLIES);
    }, 600);
  }, []);

  // 메시지 유틸
  const append = useCallback((role, item) => {
    setMessages((prev) => [...prev, { id: String(Date.now() + Math.random()), role, ...item }]);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
  }, []);
  const appendUser = useCallback((text) => { append("user", { text }); setQuickReplies([]); }, [append]);
  const appendBot = useCallback((text, isMap = false, mapProps = undefined) => append("bot", { text, isMap, mapProps }), [append]);
  const appendSystem = useCallback((text) => append("system", { text }), [append]);

  // 메시지 버블
  const QuickReply = ({ text, onPress }) => (
    <TouchableOpacity style={styles.quickReplyButton} onPress={() => onPress(text)}>
      <Text style={styles.quickReplyText}>{text}</Text>
    </TouchableOpacity>
  );
  const MessageBubble = ({ item }) => {
    const avatarSize = responsiveWidth(40) + fontOffset * 1.5;

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
          <Image source={BOT_AVATAR} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
          <Text style={styles.botName}>함께타요</Text>
        </View>
        <View style={styles.botBubbleContainer}>
          <View style={[styles.bubble, styles.botBubble]}>
            {item.isMap ? (
              <View style={{ width: "100%" }}>
                <BarrierFreeMapMini
                  stationName={item.mapProps?.stationName || "노원"}
                  imageUrl={item.mapProps?.imageUrl || null}
                  height={item.mapProps?.height || 260}
                />
              </View>
            ) : (
              <Text style={[styles.messageText, styles.botText]}>{item.text}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ---------------------- 엘리베이터 조회 (기존 유지) ---------------------- */
  const runElevSearch = useCallback(async (query) => {
    const q = (query || "").trim();
    if (!q) {
      appendBot("역명이나 역코드를 입력해주세요. 예) 종각 / 0150");
      setQuickReplies(DEFAULT_QUICK_REPLIES);
      return;
    }
    setLoading(true);
    appendBot("🔎 엘리베이터 상태 조회 중…");
    const rows = searchLocalElev(q);
    if (!rows.length) {
      appendBot("⚠️ 결과가 0건입니다. 다른 입력으로 시도해보세요.");
      setLoading(false);
      setQuickReplies(DEFAULT_QUICK_REPLIES);
      return;
    }
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
    setQuickReplies(DEFAULT_QUICK_REPLIES);
  }, [appendBot]);

  /* ---------------------- 🚇 최단 경로 (요약을 챗봇으로 표시) ---------------------- */
  const runPathSearch = useCallback(async (start, end, opts = { wheelchair: false }) => {
    appendBot(`🚇 ${start} → ${end} 최단경로를 탐색합니다...`);
    setLoading(true);
    try {
      const data = await fetchSubwayPath(start, end, !!opts.wheelchair);

      const depRaw = data?.routeSummary?.departure ?? data?.dep ?? data?.start ?? start;
      const arrRaw = data?.routeSummary?.arrival ?? data?.arr ?? data?.end ?? end;

      const clean = (s) => String(s || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();
      const depName = clean(depRaw) || start;
      const arrName = clean(arrRaw) || end;
      setLastPathEnd(arrName); // 화장실 지도 시 기본 참조 역

      const time =
        data?.routeSummary?.estimatedTime ??
        data?.totalTime ?? data?.duration ?? data?.time ?? "?";
      const transfers =
        data?.routeSummary?.transfers ??
        data?.transfers ?? data?.transferCount ?? 0;

      const sf = data?.stationFacilities || {};
      const ti = Array.isArray(data?.transferInfo) ? data.transferInfo : [];
      const linesToText = (v) => Array.isArray(v) ? v.join("\n") : (typeof v === "string" ? v : "");

      const steps = [];
      if (sf?.departure?.station) {
        const depDesc = linesToText(sf.departure.displayLines) || sf.departure.text || "";
        steps.push(`🚉 출발: ${sf.departure.station}\n${depDesc}`.trim());
      }
      for (const info of ti) {
        const idx = info?.index ?? steps.length;
        const desc = linesToText(info?.displayLines) || info?.text ||
          (info?.fromLine && info?.toLine ? `${info.fromLine} → ${info.toLine}` : "");
        steps.push(`🚉 ${idx}회 환승: ${info?.station || ""}\n${desc}`.trim());
      }
      if (sf?.arrival?.station) {
        const arrDesc = linesToText(sf.arrival.displayLines) || sf.arrival.text || "";
        steps.push(`🚉 도착: ${sf.arrival.station}\n${arrDesc}`.trim());
      }

      const stepsText = steps.length ? steps.join("\n\n") : "세부 이동 안내가 없습니다.";
      appendBot(`✅ ${depName} → ${arrName}\n⏱ 소요 시간: ${time}분 | 🔄 환승 ${transfers}회\n\n${stepsText}`);
    } catch (err) {
      console.error("🚨 fetchSubwayPath error:", err);
      appendBot("⚠️ 경로 탐색 중 오류가 발생했습니다. 역명을 다시 확인해주세요.");
    } finally {
      setLoading(false);
      setQuickReplies(DEFAULT_QUICK_REPLIES);
    }
  }, [appendBot]);

  /* ---------------------- 자연어: “강남에서 노원까지” ---------------------- */
  const handlePathNatural = useCallback(async (text) => {
    const msg = text.trim().replace(/\s+/g, " ");
    const match = msg.match(/(.+?)에서\s*(.+?)까지/);
    if (!match) return false;
    const start = match[1].trim();
    const end = match[2].trim();
    if (!start || !end) return false;
    await runPathSearch(start, end);
    return true;
  }, [runPathSearch]);

  /* ---------------------- 명령 처리 ---------------------- */
  const handleElevCommand = useCallback(async (arg) => {
    if (!arg?.trim()) {
      appendBot("사용법: /elev [역코드 또는 역명]\n예) /elev 0150  또는  /elev 종각");
      setQuickReplies(DEFAULT_QUICK_REPLIES);
      return;
    }
    await runElevSearch(arg.trim());
  }, [runElevSearch, appendBot]);

  const handleCommand = useCallback(async (text) => {
    const msg = text.trim();

    // 자연어 경로 탐색
    const handledPath = await handlePathNatural(msg);
    if (handledPath) return true;

    // /elev
    if (msg.startsWith("/elev")) {
      const arg = msg.replace(/^\/elev\s*/i, "");
      await handleElevCommand(arg);
      return true;
    }
    return false;
  }, [handleElevCommand, handlePathNatural]);

  /* ---------------------- 전송 ---------------------- */
  const onSend = useCallback(async (text) => {
    const t = text || input.trim();
    if (!t) return;
    appendUser(t);
    setInput("");

    // 경로 대화형 모드
    if (mode === "pathStartAwait") {
      setPathStart(t);
      setMode("pathEndAwait");
      appendBot("도착역을 입력해주세요.");
      return;
    }
    if (mode === "pathEndAwait") {
      const start = pathStart;
      const end = t;
      setMode(null);
      setPathStart("");
      await runPathSearch(start, end);
      return;
    }

    // 엘리베이터 모드
    if (mode === "elevAwait") {
      setMode(null);
      await runElevSearch(t);
      return;
    }

    setLoading(true);

    // 퀵: 엘리베이터
    if (t.includes("엘리베이터 상태 조회")) {
      appendBot("조회할 역명을 입력해주세요. 예) 종각 / 서울대입구 / 0150");
      setMode("elevAwait");
      setLoading(false);
      return;
    }

    // 퀵: 지하철 최단 경로
    if (t.includes("지하철 최단 경로")) {
      appendBot("출발역을 입력해주세요.");
      setMode("pathStartAwait");
      setLoading(false);
      return;
    }

    // 퀵: 화장실 ⇒ 미니 지도 (화장실만 우선)
    if (t.includes("화장실")) {
      const stationName = lastPathEnd || "노원";
      // preferLine은 최근 경로의 도착 노선이 있다면 전달 가능. 지금은 null.
      const imageUrl = getMapImageUrlFromJson(stationName, null);

      // 1) 지도 말풍선
      appendBot("", true, { stationName, imageUrl, height: 260 });

      // 2) 안내 텍스트
      if (!imageUrl) {
        appendBot(`🗺 ${stationName}역 지도 이미지를 찾지 못했습니다. station_images.json(DATA) 내 sttn과 img_link를 확인해 주세요.`);
      } else {
        appendBot(`현재 기준 ${stationName}역의 화장실 위치를 표시했습니다.`);
      }
      setQuickReplies(DEFAULT_QUICK_REPLIES);
      setLoading(false);
      return;
    }

    // 기타 명령
    const handled = await handleCommand(t);
    if (!handled) {
      setTimeout(() => {
        appendBot(
          "알 수 없는 명령입니다.\n- 빠른 사용: \"엘리베이터 상태 조회\" → 역명 입력\n- 또는: /elev [역코드|역명]\n- 또는: \"지하철 최단 경로\" → 출발/도착 입력\n- 또는: \"강남에서 노원까지\""
        );
        setLoading(false);
        setQuickReplies(DEFAULT_QUICK_REPLIES);
      }, 300);
    } else {
      setLoading(false);
    }
  }, [input, appendUser, appendBot, mode, pathStart, runElevSearch, handleCommand, runPathSearch, lastPathEnd]);

  /* ---------------------- 렌더 ---------------------- */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? responsiveHeight(80) : 0}
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

        {mode === "elevAwait" && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View
              style={{
                alignSelf: "flex-start",
                paddingVertical: 6 + fontOffset / 4,
                paddingHorizontal: 10 + fontOffset / 2,
                borderRadius: 9999,
                backgroundColor: "#EEFDFD",
                borderWidth: 1,
                borderColor: "#CFF5F5",
              }}
            >
              <Text style={{
                color: "#0A6B6A",
                fontWeight: "600",
                fontSize: responsiveFontSize(13) + fontOffset
              }}>
                승강기 조회 모드: 역명을 입력하세요
              </Text>
            </View>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={mode === "elevAwait" ? "예: 종각 / 서울대입구 / 0150" : "메시지를 입력하세요."}
            placeholderTextColor="#595959"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => onSend()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => onSend()} disabled={loading}>
            <Ionicons
              name="send"
              size={responsiveWidth(24) + fontOffset / 2}
              color={input.trim() ? "#17171B" : "#A8A8A8"}
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
