// src/screens/chatbot/ChatBotScreen.js
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
  Linking, 
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createChatbotStyles } from "../../styles/chatbotStyles";
import { responsiveWidth, responsiveHeight } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import { fetchSubwayPath } from "../pathfinder/PathFinderScreen";
import BarrierFreeMapMini from "../../components/BarrierFreeMapMini";

import { getFacilityForStation } from "../../api/metro/elevEsLocal";
import { getToiletsForStation } from "../../api/metro/toiletLocal";
import { getDisabledToiletsForStation } from "../../api/metro/disabled_toiletLocal";
import { getWheelchairLiftsForStation } from "../../api/metro/wheelchairLiftLocal";
import { getAudioBeaconsForStation } from "../../api/metro/voiceLocal";
import { getNursingRoomsForStation } from "../../api/metro/nursingRoomLocal";
import { getLockersForStation } from "../../api/metro/lockerLocal";

import { useApiFacilities } from "../../hook/useApiFacilities";

import stationImages from "../../assets/metro-data/metro/station/station_images.json";

const BOT_AVATAR = require("../../assets/brand-icon.png");

const FAQ_GROUPS = [
  {
    title: "지하철 경로 안내",
    color: "#B3E5FC", 
    items: [{ key: "ROUTE", label: "지하철 최단경로 찾기" }],
  },
  {
    title: "역 이용 및 편의시설 정보",
    color: "#B2EBF2", 
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
  {
    title: "실시간 지하철 정보",
    color: "#C8E6C9", 
    items: [
      { key: "NT", label: "실시간 지하철 알림" },
      { key: "CS", label: "불편 신고하기" },
    ],
  },
];
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

  useEffect(() => {
    append("system", { text: "함께타요 챗봇에 연결합니다" });
    append("bot", { text: "안녕하세요! 어떤 정보를 원하시나요?" });
    append("menu", {});
  }, []);

  const append = (role, item) => {
    setMessages((prev) => [...prev, { id: String(Date.now() + Math.random()), role, ...item }]);
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 60);
  };
  const appendUser = (text) => append("user", { text });
  const appendBot = (text, isMap = false, mapProps) => append("bot", { text, isMap, mapProps });
  const handleSendComplaint = () => {
  const phoneNumber = "1577-1234";
  const defaultBody = "지하철 이용 중 불편사항이 있습니다.\n(내용을 입력해주세요)";
  const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(defaultBody)}`;

  Linking.canOpenURL(smsUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(smsUrl);
      } else {
        Alert.alert("문자 전송 불가", "이 기기에서 문자 기능을 지원하지 않습니다.");
      }
    })
    .catch((err) => {
      console.error("문자 전송 오류:", err);
      Alert.alert("오류", "문자 앱을 열 수 없습니다.");
    });
};
  const { data: apiData, loading: apiLoading, error: apiError } = useApiFacilities(
    currentStation,
    "",
    "",
    facilityType
  );

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
      NT: "실시간 지하철 알림",
    };
    const title = titleMap[type] || "시설";
    const head = `【${title}】`;

    if (type === "NT") {
      if (apiLoading) return `${head}\n 실시간 공지를 불러오는 중입니다...`;
      if (apiError) return `${head}\n API 오류 발생: ${apiError}`;
      if (!apiData.length) return `${head}\n"${stationName}" 관련 공지가 없습니다.`;

      const list = apiData
        .map(
          (n, i) =>
            `#${i + 1} [${n.line}] ${n.title}\n${n.desc}\n${n.status}\n ${
              n.occurred ? n.occurred.replace("T", " ") : ""
            }`
        )
        .join("\n\n");
      return `${head}\n${list}`;
    }

    if (["EV", "ES", "TO", "DT", "WC"].includes(type)) {
      if (apiLoading) return `${head}\n실시간 정보를 불러오는 중입니다...`;
      if (apiError) return `${head}\n API 오류 발생: ${apiError}`;
      if (!apiData.length) return `${head}\n${stationName}역의 ${title} 정보가 없습니다.`;

      if (type === "WC") {
        return `${head}\n${apiData
          .map(
            (r, i) =>
              `#${i + 1} ${r.desc}\n${r.charge ? `${r.charge}` : ""}${
                r.chargerCount ? ` (${r.chargerCount}기)` : ""
              }`
          )
          .join("\n\n")}`;
      }

      return `${head}\n${apiData
        .map(
          (r, i) =>
            `#${i + 1} ${r.desc}\n${
              /보수|고장|중단/.test(r.status) ? "(보수중)" : "(사용가능)"
            }`
        )
        .join("\n\n")}`;
    }

    const localFallbacks = {
      EV: getFacilityForStation,
      ES: getFacilityForStation,
      TO: getToiletsForStation,
      DT: getDisabledToiletsForStation,
      WL: getWheelchairLiftsForStation,
      VO: getAudioBeaconsForStation,
      NU: getNursingRoomsForStation,
      LO: getLockersForStation,
    };

    const localFunc = localFallbacks[type];
    if (!localFunc) return `${head}\n데이터가 없습니다.`;

    const rows = localFunc(stationName, type);
    if (!rows.length) return `${head}\n${stationName}역의 ${title} 정보가 없습니다.`;
    return `${head}\n${rows.map((r, i) => `#${i + 1} ${r.desc || r.title}`).join("\n\n")}`;
  }

  const runFacilityMap = async (stationName, type) => {
    setCurrentStation(stationName);
    setFacilityType(type);

    if (type === "NT") {
      appendBot(` ${stationName}역의 실시간 공지사항을 불러옵니다...`);
      return;
    }

    const imageUrl = getMapImageUrlFromJson(stationName);
    appendBot("", true, { stationName, imageUrl, type });
    appendBot(`【${type === "WC" ? "휠체어 급속충전기" : "시설"}】\n실시간 정보를 불러오는 중입니다...`);
  };

  useEffect(() => {
    if (!facilityType || !currentStation) return;
    if (apiLoading) return;

    const text = formatFacilityList({ type: facilityType, stationName: currentStation });
    appendBot(text);
    append("menuButton", {});
  }, [apiData, apiError, apiLoading]);

const runPathSearch = useCallback(
  async (start, end, opts = { wheelchair: false }) => {
    appendBot(` ${start} → ${end} ${opts.wheelchair ? " 휠체어 경로" : "최단경로"}를 탐색합니다...`);
    setLoading(true);
    try {
      const data = await fetchSubwayPath(start, end, !!opts.wheelchair);

      const depRaw = data?.routeSummary?.departure ?? data?.dep ?? data?.start ?? start;
      const arrRaw = data?.routeSummary?.arrival ?? data?.arr ?? data?.end ?? end;

      const clean = (s) => String(s || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();
      const depName = clean(depRaw) || start;
      const arrName = clean(arrRaw) || end;

      const time =
        data?.routeSummary?.estimatedTime ??
        data?.totalTime ?? data?.duration ?? data?.time ?? "?";
      const transfers =
        data?.routeSummary?.transfers ??
        data?.transfers ?? data?.transferCount ?? 0;

      const sf = data?.stationFacilities || {};
      const ti = Array.isArray(data?.transferInfo) ? data.transferInfo : [];
      const linesToText = (v) =>
        Array.isArray(v) ? v.join("\n") : (typeof v === "string" ? v : "");

      const steps = [];
      if (sf?.departure?.station) {
        const depDesc = linesToText(sf.departure.displayLines) || sf.departure.text || "";
        steps.push(` 출발: ${sf.departure.station}\n${depDesc}`.trim());
      }
      for (const info of ti) {
        const idx = info?.index ?? steps.length;
        const desc =
          linesToText(info?.displayLines) ||
          info?.text ||
          (info?.fromLine && info?.toLine ? `${info.fromLine} → ${info.toLine}` : "");
        steps.push(` ${idx}회 환승: ${info?.station || ""}\n${desc}`.trim());
      }
      if (sf?.arrival?.station) {
        const arrDesc = linesToText(sf.arrival.displayLines) || sf.arrival.text || "";
        steps.push(`도착: ${sf.arrival.station}\n${arrDesc}`.trim());
      }

      const stepsText = steps.length ? steps.join("\n\n") : "세부 이동 안내가 없습니다.";
      appendBot(` ${depName} → ${arrName}\n⏱ 소요 시간: ${time} |  환승 ${transfers}회\n\n${stepsText}`);
    } catch (err) {
      console.error("🚨 fetchSubwayPath error:", err);
      appendBot(" 경로 탐색 중 오류가 발생했습니다. 역명을 다시 확인해주세요.");
    } finally {
      setLoading(false);
      append("menuButton", {}); 
    }
  },
  [appendBot]
);

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
        <View style={styles.menuButtonContainer}>
          <View style={styles.menuButtonSpacer} />
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              setCurrentStation("");
              setFacilityType(null);
              setMode(null);
              append("menu", {});
            }}
          >
            <Text style={styles.menuButtonText}>메뉴 다시보기</Text>
          </TouchableOpacity>
        </View>
      );
    if (item.role === "menu") {
      return (
        <View style={styles.menuRow}>
          <View style={styles.menuSpacer} />
          <View style={styles.menuContainer}>
            {FAQ_GROUPS.map((group) => (
              <View key={group.title} style={styles.menuGroup}>
                <View
                  style={[
                    styles.menuHeader,
                    { backgroundColor: group.color }, 
                  ]}
                >
                  <Text style={styles.menuHeaderText}>{group.title}</Text>
                </View>
                <View>
                  {group.items.map((it, i) => (
                    <TouchableOpacity
                      key={it.key}
                      style={[
                        styles.menuItem,
                        i === 0 && styles.menuItemFirst, 
                      ]}
                      onPress={() => {
                        if (it.key === "ROUTE") {
                          appendBot("휠체어 이용자이신가요? (네 / 아니오)");
                          setMode("wheelchairAsk");
                          return;
                        }
                        if (it.key === "CS") {
                          handleSendComplaint();
                          return;
                        }
                        setFacilityType(it.key);
                        setMode("facilityAwait");
                        appendBot(
                      it.key === "NT"
                        ? "알림을 확인할 역명을 입력해주세요."
                        : it.label.replace(" 위치", "") + "를 확인할 역명을 입력해주세요."
                    );
                      }}
                    >
                      <Text style={styles.menuItemText}>{it.label}</Text>
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