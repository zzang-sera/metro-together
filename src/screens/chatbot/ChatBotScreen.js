// ✅ src/screens/chatbot/ChatBotScreen.js
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { createChatbotStyles } from "../../styles/chatbotStyles";
import { responsiveWidth, responsiveHeight } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import { fetchSubwayPath } from "../pathfinder/PathFinderScreen";
import BarrierFreeMapMini from "../../components/BarrierFreeMapMini";

/* ---------------------- 로컬 JSON API ---------------------- */
import { getFacilityForStation } from "../../api/metro/elevEsLocal";
import { getToiletsForStation } from "../../api/metro/toiletLocal";
import { getDisabledToiletsForStation } from "../../api/metro/disabled_toiletLocal";
import { getWheelchairLiftsForStation } from "../../api/metro/wheelchairLiftLocal";
import { getAudioBeaconsForStation } from "../../api/metro/voiceLocal";
import { getNursingRoomsForStation } from "../../api/metro/nursingRoomLocal";
import { getLockersForStation } from "../../api/metro/lockerLocal";

/* ---------------------- 실시간 API 훅 ---------------------- */
import { useApiFacilities } from "../../hook/useApiFacilities";

import stationImages from "../../assets/metro-data/metro/station/station_images.json";

const BOT_AVATAR = require("../../assets/brand-icon.png");

/* ---------------------- 메뉴 구성 ---------------------- */
const FAQ_GROUPS = [
  {
    title: "지하철 경로 안내",
    color: "#0BA7B5",
    items: [{ key: "ROUTE", label: "지하철 최단경로 찾기" }],
  },
  {
    title: "역 이용 및 편의시설 정보",
    color: "#14CAC9",
    items: [
      { key: "EV", label: "엘리베이터 위치" },
      { key: "ES", label: "에스컬레이터 위치" },
      { key: "TO", label: "화장실 위치" },
      { key: "DT", label: "장애인 화장실 위치" },
      { key: "WL", label: "휠체어 리프트 위치" },
      { key: "WC", label: "휠체어 급속충전 위치" },
      { key: "VO", label: "음성유도기 위치" },
      { key: "NU", label: "수유실 위치" },
      { key: "LO", label: "보관함 위치" },
    ],
  },
];

/* ---------------------- 유틸 ---------------------- */
function normalizeStationName(name) {
  return String(name || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();
}

function getMapImageUrlFromJson(stationName) {
  const data = stationImages?.DATA;
  if (!Array.isArray(data)) return null;
  const key = normalizeStationName(stationName);
  const found = data.find((it) => normalizeStationName(it.sttn || it.STTN) === key);
  return found?.img_link || null;
}

/* ---------------------- 메인 컴포넌트 ---------------------- */
export default function ChatBotScreen() {
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [mode, setMode] = useState(null);
  const [pathStart, setPathStart] = useState("");
  const [facilityType, setFacilityType] = useState(null);
  const [currentStation, setCurrentStation] = useState("");
  const listRef = useRef(null);
  const styles = useMemo(() => createChatbotStyles(fontOffset), [fontOffset]);

  /* ---------------------- 초기 메시지 ---------------------- */
  useEffect(() => {
    append("system", { text: "함께타요 챗봇에 연결합니다" });
    append("bot", { text: "안녕하세요! 어떤 정보를 원하시나요?" });
    append("menu", {});
  }, []);

  /* ---------------------- 메시지 출력 헬퍼 ---------------------- */
  const append = (role, item) => {
    setMessages((prev) => [...prev, { id: String(Date.now() + Math.random()), role, ...item }]);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 60);
  };
  const appendUser = (text) => append("user", { text });
  const appendBot = (text, isMap = false, mapProps) => append("bot", { text, isMap, mapProps });

  /* ---------------------- 실시간 API 훅 ---------------------- */
  const { data: apiData, loading: apiLoading, error: apiError } = useApiFacilities(
    currentStation,
    "",
    "",
    facilityType
  );

  /* ---------------------- 시설정보 포맷 ---------------------- */
  function formatFacilityList({ type, stationName }) {
    const titleMap = {
      EV: "엘리베이터",
      ES: "에스컬레이터",
      TO: "화장실",
      DT: "장애인 화장실",
      WL: "휠체어 리프트",
      WC: "휠체어 급속충전기",
      VO: "음성유도기",
      NU: "수유실",
      LO: "보관함",
    };
    const title = titleMap[type] || "시설";
    const head = `【${title}】`;

    /* ✅ 1️⃣ 실시간 API (EV, ES, TO, DT, WC) */
    if (["EV", "ES", "TO", "DT", "WC"].includes(type)) {
      if (apiLoading) return `${head}\n실시간 정보를 불러오는 중입니다...`;
      if (apiError) return `${head}\n⚠️ API 오류 발생: ${apiError}`;

      // 휠체어 급속충전기 (API 전용)
      if (type === "WC") {
        if (!apiData.length)
          return `${head}\n${stationName}역의 API 데이터가 존재하지 않습니다.`;
        return `${head}\n${apiData
          .map(
            (r, i) =>
              `#${i + 1} ${r.desc}\n${r.charge ? `${r.charge}` : ""}${
                r.chargerCount ? ` (${r.chargerCount}기)` : ""
              }`
          )
          .join("\n\n")}`;
      }

      // 나머지 설비 (엘리베이터, 에스컬레이터, 화장실, 장애인 화장실)
      if (apiData.length) {
        return `${head}\n${apiData
          .map(
            (r, i) =>
              `#${i + 1} ${r.desc}\n${
                /보수|고장|중단/.test(r.status) ? "(보수중)" : "(사용가능)"
              }`
          )
          .join("\n\n")}`;
      }
    }

    /* ✅ 2️⃣ 로컬 JSON Fallback */
    if (type === "EV" || type === "ES") {
      const rows = getFacilityForStation(stationName, type);
      if (!rows.length) return `${head}\n${stationName}역의 ${title} 정보가 없습니다.`;
      return `${head}\n${rows.map((r, i) => `#${i + 1} ${r.desc}`).join("\n\n")}`;
    }
    if (type === "TO") {
      const rows = getToiletsForStation(stationName);
      if (!rows.length) return `${head}\n${stationName}역의 화장실 정보가 없습니다.`;
      return `${head}\n${rows.map((r, i) => `#${i + 1} ${r.desc}`).join("\n\n")}`;
    }
    if (type === "DT") {
      const rows = getDisabledToiletsForStation(stationName);
      if (!rows.length) return `${head}\n${stationName}역의 장애인 화장실 정보가 없습니다.`;
      return `${head}\n${rows.map((r, i) => `#${i + 1} ${r.desc}`).join("\n\n")}`;
    }
    if (type === "WL") {
      const rows = getWheelchairLiftsForStation(stationName);
      if (!rows.length)
        return `${head}\n${stationName}역의 휠체어 리프트 정보가 없습니다.`;
      return `${head}\n${rows.map((r, i) => `#${i + 1} ${r.desc}`).join("\n\n")}`;
    }
    if (type === "VO") {
      const rows = getAudioBeaconsForStation(stationName);
      if (!rows.length)
        return `${head}\n${stationName}역의 음성유도기 정보가 없습니다.`;
      return `${head}\n${rows.map((r, i) => `#${i + 1} ${r.desc}`).join("\n")}`;
    }
    if (type === "NU") {
      const rows = getNursingRoomsForStation(stationName);
      if (!rows.length)
        return `${head}\n${stationName}역의 수유실 정보가 없습니다.`;
      return `${head}\n${rows
        .map((r, i) => `#${i + 1} ${r.desc.replace(/·/g, " ").trim()}`)
        .join("\n\n")}`;
    }
    if (type === "LO") {
      const rows = getLockersForStation(stationName);
      if (!rows.length)
        return `${head}\n${stationName}역의 보관함 정보가 없습니다.`;
      const filtered = rows.filter((r) =>
        r.title.includes(stationName.replace(/역$/, "").trim())
      );
      const final = filtered.length ? filtered : rows;
      return `${head}\n${final
        .map((r, i) => `#${i + 1} ${r.title}\n${r.desc}`)
        .join("\n\n")}`;
    }

    return `${head}\n데이터가 없습니다.`;
  }

  /* ---------------------- 지도 + 시설 정보 출력 ---------------------- */
  const runFacilityMap = async (stationName, type) => {
    setCurrentStation(stationName);
    setFacilityType(type);
    const imageUrl = getMapImageUrlFromJson(stationName);
    appendBot("", true, { stationName, imageUrl, type });
    appendBot(`【${type === "WC" ? "휠체어 급속충전기" : "시설"}】\n실시간 정보를 불러오는 중입니다...`);
  };

  /* ---------------------- API 완료 시 메시지 자동 갱신 ---------------------- */
  useEffect(() => {
    if (!facilityType || !currentStation) return;
    if (apiLoading) return;
    const text = formatFacilityList({ type: facilityType, stationName: currentStation });
    appendBot(text);
    append("menuButton", {});
  }, [apiData, apiError, apiLoading]);

  /* ---------------------- 경로찾기 ---------------------- */
  const runPathSearch = useCallback(async (start, end, opts = { wheelchair: false }) => {
    appendBot(`🚇 ${start} → ${end} ${opts.wheelchair ? "🦽 휠체어 경로" : "최단경로"}를 탐색합니다...`);
    setLoading(true);
    try {
      const data = await fetchSubwayPath(start, end, !!opts.wheelchair);
      const dep = data?.routeSummary?.departure ?? start;
      const arr = data?.routeSummary?.arrival ?? end;
      const time = data?.routeSummary?.estimatedTime ?? "?";
      const transfers = data?.routeSummary?.transfers ?? 0;
      appendBot(`✅ ${dep} → ${arr}\n⏱ 소요 시간: ${time}분 | 🔄 환승 ${transfers}회`);
    } catch {
      appendBot("⚠️ 경로 탐색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      append("menuButton", {});
    }
  }, []);

  /* ---------------------- 메시지 렌더링 ---------------------- */
  const MessageBubble = ({ item }) => {
    const avatarSize = responsiveWidth(40) + fontOffset * 1.5;
    if (item.role === "system")
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemBubble}>
            <Text style={styles.systemText}>{item.text}</Text>
          </View>
        </View>
      );
    if (item.role === "menuButton")
      return (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 10 }}>
          <View style={{ width: avatarSize, marginRight: 8 }} />
          <TouchableOpacity
            style={{
              backgroundColor: "#14CAC9",
              borderRadius: 20,
              paddingVertical: 10,
              paddingHorizontal: 20,
              alignSelf: "flex-start",
            }}
            onPress={() => append("menu", {})}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>메뉴 다시보기</Text>
          </TouchableOpacity>
        </View>
      );
    if (item.role === "menu") {
      return (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ width: avatarSize, marginRight: 8 }} />
          <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 10, elevation: 2 }}>
            {FAQ_GROUPS.map((group) => (
              <View key={group.title} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: group.color,
                    borderTopLeftRadius: 14,
                    borderTopRightRadius: 14,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>{group.title}</Text>
                </View>
                <View>
                  {group.items.map((it, i) => (
                    <TouchableOpacity
                      key={it.key}
                      style={{
                        padding: 14,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderColor: "#eee",
                      }}
                      onPress={() => {
                        if (it.key === "ROUTE") {
                          appendBot("휠체어 이용자이신가요? (네 / 아니오)");
                          setMode("wheelchairAsk");
                          return;
                        }
                        setFacilityType(it.key);
                        setMode("facilityAwait");
                        appendBot(`${it.label.replace(" 위치", "")}를 확인할 역명을 입력해주세요.`);
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: "#17171B" }}>{it.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (item.role === "user")
      return (
        <View style={[styles.messageRow, styles.userMessageRow]}>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
          </View>
        </View>
      );

    return (
      <View style={[styles.messageRow, styles.botMessageRow]}>
        <View style={styles.avatarContainer}>
          <Image source={BOT_AVATAR} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
          <Text style={styles.botName}>함께타요</Text>
        </View>
        <View style={styles.botBubbleContainer}>
          <View style={[styles.bubble, styles.botBubble]}>
            {item.isMap ? (
              <BarrierFreeMapMini
                stationName={item.mapProps?.stationName}
                imageUrl={item.mapProps?.imageUrl}
                type={item.mapProps?.type}
              />
            ) : (
              <Text style={[styles.messageText, styles.botText]}>{item.text}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ---------------------- 입력 처리 ---------------------- */
  const onSend = async (text) => {
    const t = text || input.trim();
    if (!t) return;
    appendUser(t);
    setInput("");

    if (mode === "wheelchairAsk") {
      const ans = t.trim();
      setWheelchair(ans.includes("네"));
      appendBot(ans.includes("네") ? "휠체어 경로로 안내하겠습니다. 출발역을 입력해주세요." : "일반 경로로 안내하겠습니다. 출발역을 입력해주세요.");
      setMode("pathStartAwait");
      return;
    }

    if (mode === "pathStartAwait") {
      setPathStart(t);
      setMode("pathEndAwait");
      appendBot("도착역을 입력해주세요.");
      return;
    }

    if (mode === "pathEndAwait") {
      setMode(null);
      await runPathSearch(pathStart, t, { wheelchair });
      return;
    }

    if (mode === "facilityAwait" && facilityType) {
      setMode(null);
      await runFacilityMap(t, facilityType);
      return;
    }

    appendBot("하단 메뉴에서 항목을 선택해주세요.");
  };

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

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="메시지를 입력하세요."
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

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#14CAC9" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
