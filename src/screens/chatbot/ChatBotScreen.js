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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createChatbotStyles } from "../../styles/chatbotStyles";
import { responsiveWidth, responsiveHeight } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";

import BarrierFreeMapMini from "../../components/BarrierFreeMapMini";
import stationImages from "../../assets/metro-data/metro/station/station_images.json";

import toiletData from "../../assets/metro-data/metro/toilets/서울교통공사_역사공중화장실정보_20241127.json";
import disabledToiletData from "../../assets/metro-data/metro/disabled_toilets/서울교통공사_역사장애인화장실정보_20241127.json";
import babyRoomData from "../../assets/metro-data/metro/babyroom/서울교통공사_수유실현황_20250924.json";
import lockerData from "../../assets/metro-data/metro/lostandFound/서울교통공사_물품보관함 위치정보_20240930.json";
import liftData from "../../assets/metro-data/metro/wheelchairLift/서울교통공사_휠체어리프트 설치현황_20250310.json";

const BOT_AVATAR = require("../../assets/brand-icon.png");

/* ---------------------- 공통 유틸 ---------------------- */
function normalizeStationName(name) {
  return String(name || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();
}

function getMapImageUrlFromJson(stationName, preferLine = null) {
  const data = stationImages?.DATA;
  if (!Array.isArray(data)) return null;

  const key = normalizeStationName(stationName);
  const candidates = data.filter((it) => {
    const raw = String(it.sttn || it.STTN || "").trim();
    const norm = normalizeStationName(raw);
    return norm === key || raw === stationName || raw === `${key}역`;
  });

  if (candidates.length === 0) {
    console.warn("⚠️ No map image found for:", stationName);
    return null;
  }

  let picked = null;
  if (preferLine != null) {
    const lineStr = String(preferLine).replace(/호선$/, "");
    const byLine = candidates.filter((it) => String(it.sbwy_rout_ln) === lineStr);
    if (byLine.length > 0) {
      byLine.sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999));
      picked = byLine[0];
    }
  }

  if (!picked) {
    candidates.sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999));
    picked = candidates[0];
  }

  if (!picked || !picked.img_link) {
    console.warn("🚨 Image data malformed:", stationName, picked);
    return null;
  }

  const link = picked?.img_link || picked?.IMG_LINK;
  if (typeof link !== "string" || link.length === 0) {
    console.warn("🚨 Invalid image URL:", stationName, link);
    return null;
  }

  return link;
}

/* ---------------------- 시설 데이터 매칭 ---------------------- */
function getFacilityList(stationName, type) {
  try {
    let data = [];
    let title = "";
    let list = [];

    switch (type) {
      case "TO":
        data = toiletData.filter((d) => d.역명.includes(stationName));
        title = "🚻 일반 화장실";
        list = data.map(
          (t) => `• ${t.화장실명 || "화장실"} - ${t.상세위치 || "위치정보 없음"}`
        );
        break;
      case "DT":
        data = disabledToiletData.filter((d) => d.역명.includes(stationName));
        title = "♿ 장애인 화장실";
        list = data.map(
          (t) => `• ${t.화장실명 || "장애인 화장실"} - ${t.상세위치 || "위치정보 없음"}`
        );
        break;
      case "WL":
        data = liftData.filter((d) => d.역명.includes(stationName));
        title = "🛗 휠체어 리프트";
        list = data.map(
          (t) =>
            `• ${t["시작층(상세위치)"] || ""} ↔ ${t["종료층(상세위치)"] || ""}`.trim()
        );
        break;
      case "NU":
        data = babyRoomData.filter((d) => d.역명.includes(stationName));
        title = "👶 수유실";
        list = data.map((t) => `• ${t["상세위치"] || "위치정보 없음"}`);
        break;
      case "LO":
        data = lockerData.filter((d) =>
          String(d["상세위치"] || "").includes(stationName)
        );
        title = "📦 물품보관함";
        list = data.map((t) => `• ${t["상세위치"] || "위치정보 없음"}`);
        break;
    }

    return { title, list };
  } catch (err) {
    console.error("🚨 Facility data error:", err);
    return { title: "⚠️ 오류", list: ["데이터를 불러오지 못했습니다."] };
  }
}

/* ---------------------- 메인 컴포넌트 ---------------------- */
export default function ChatBotScreen() {
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [awaiting, setAwaiting] = useState(null);
  const [loading, setLoading] = useState(false);

  const listRef = useRef(null);
  const styles = useMemo(() => createChatbotStyles(fontOffset), [fontOffset]);

  const DEFAULT_QUICK_REPLIES = [
    "가장 가까운 화장실 위치 알려줘",
    "장애인 화장실 위치 알려줘",
    "휠체어리프트 위치 알려줘",
    "수유실 위치 알려줘",
    "보관함 위치 알려줘",
  ];

  useEffect(() => {
    appendSystem("함께타요 챗봇에 연결합니다");
    setTimeout(() => {
      appendBot("안녕하세요! 어떤 정보를 원하시나요?");
      setQuickReplies(DEFAULT_QUICK_REPLIES);
    }, 600);
  }, []);

  /* 메시지 추가 유틸 */
  const append = useCallback((role, item) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, role, ...item },
    ]);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
  }, []);

  const appendUser = useCallback(
    (text) => {
      append("user", { text });
      setQuickReplies([]);
    },
    [append]
  );

  const appendBot = useCallback(
    (text, isMap = false, mapProps = undefined) => append("bot", { text, isMap, mapProps }),
    [append]
  );

  const appendSystem = useCallback((text) => append("system", { text }), [append]);

  /* ---------------------- 전송 로직 ---------------------- */
  const onSend = useCallback(
    async (text) => {
      const t = text || input.trim();
      if (!t) return;
      appendUser(t);
      setInput("");

      if (awaiting) {
        const stationName = t.trim();
        const imageUrl = getMapImageUrlFromJson(stationName);

        if (!imageUrl) {
          appendBot(`⚠️ ${stationName}역의 지도 이미지를 불러올 수 없습니다.`);
          setAwaiting(null);
          setQuickReplies(DEFAULT_QUICK_REPLIES);
          return;
        }

        const { title, list } = getFacilityList(stationName, awaiting);

        appendBot(`${title} 위치를 표시합니다.`);
        appendBot("", true, { stationName, imageUrl, height: 260 });

        if (list.length > 0) appendBot(list.join("\n"));
        else appendBot("등록된 시설 정보가 없습니다.");

        setAwaiting(null);
        setQuickReplies(DEFAULT_QUICK_REPLIES);
        return;
      }

      // 명령어 인식
      if (t.includes("화장실") && !t.includes("장애인")) {
        appendBot("어느 역의 화장실 위치를 알려드릴까요?");
        setAwaiting("TO");
        return;
      }
      if (t.includes("장애인")) {
        appendBot("어느 역의 장애인 화장실 위치를 알려드릴까요?");
        setAwaiting("DT");
        return;
      }
      if (t.includes("리프트")) {
        appendBot("어느 역의 휠체어리프트 위치를 알려드릴까요?");
        setAwaiting("WL");
        return;
      }
      if (t.includes("수유실")) {
        appendBot("어느 역의 수유실 위치를 알려드릴까요?");
        setAwaiting("NU");
        return;
      }
      if (t.includes("보관함") || t.includes("물품")) {
        appendBot("어느 역의 보관함 위치를 알려드릴까요?");
        setAwaiting("LO");
        return;
      }

      appendBot("지원하지 않는 명령입니다.");
      setQuickReplies(DEFAULT_QUICK_REPLIES);
    },
    [input, appendUser, appendBot, awaiting]
  );

  /* ---------------------- UI ---------------------- */
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
          <Image
            source={BOT_AVATAR}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }}
          />
          <Text style={styles.botName}>함께타요</Text>
        </View>
        <View style={styles.botBubbleContainer}>
          <View style={[styles.bubble, styles.botBubble]}>
            {item.isMap ? (
              <View style={{ width: "100%" }}>
                <BarrierFreeMapMini
                  stationName={item.mapProps?.stationName || "서울"}
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

  /* ---------------------- 렌더링 ---------------------- */
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickReplyContainer}
        style={styles.quickReplyScroll}
      >
        {quickReplies.map((reply) => (
          <QuickReply key={reply} text={reply} onPress={onSend} />
        ))}
      </ScrollView>

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
