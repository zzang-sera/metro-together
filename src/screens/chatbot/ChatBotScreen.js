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

// 로컬 데이터
import elevLocalJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";
import stationImages from "../../assets/metro-data/metro/station/station_images.json";

const BOT_AVATAR = require("../../assets/brand-icon.png");

/* ---------------------- 섹션 정의 ---------------------- */
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
const sanitizeName = (s = "") =>
  (typeof s === "string" ? s.replace(/\(\s*\d+\s*\)$/g, "").trim() : "");
const normalizeStationName = (name) =>
  String(name || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();
const pickArray = (any) => (Array.isArray(any?.DATA) ? any.DATA : Array.isArray(any) ? any : []);
const koStatus = (v = "") => (v === "Y" || v === "사용가능" ? "사용가능" : v === "N" ? "중지" : v || "상태미상");
const normalizeLine = (line = "") => {
  const m = String(line).match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : String(line || "");
};

/* ---------------------- 엘리베이터 & 에스컬레이터 인덱싱 ---------------------- */
function parseElevatorJson(rawJson) {
  const rows = pickArray(rawJson).map((raw) => {
    const stnNm = raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? "";
    return {
      code: String(raw.stn_cd ?? raw.STN_CD ?? "").trim(),
      name: sanitizeName(stnNm),
      location: raw.instl_pstn ?? "",
      status: koStatus(raw.use_yn ?? ""),
      kind: raw.elvtr_se ?? "",
      line: normalizeLine(raw.line ?? ""),
      oprSec: raw.opr_sec ?? "",
    };
  });
  return rows;
}

const ELEV_ROWS = parseElevatorJson(elevLocalJson);
const ELEV_BY_NAME = new Map();
for (const r of ELEV_ROWS) {
  if (!r.name) continue;
  const arr = ELEV_BY_NAME.get(r.name) || [];
  arr.push(r);
  ELEV_BY_NAME.set(r.name, arr);
}

function searchLocalElev(stationName, type) {
  const rows = ELEV_BY_NAME.get(sanitizeName(stationName)) || [];
  return rows.filter((r) => r.kind === type);
}

/* ---------------------- 이미지 매핑 ---------------------- */
function getMapImageUrlFromJson(stationName) {
  const data = stationImages?.DATA;
  if (!Array.isArray(data)) return null;
  const key = normalizeStationName(stationName);
  const found = data.find((it) => normalizeStationName(it.sttn || it.STTN) === key);
  return found?.img_link || null;
}

/* ---------------------- 메인 ---------------------- */
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
  const [lastPathEnd, setLastPathEnd] = useState("노원");
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

  /* ---------------------- 시설 리스트 포맷터 ---------------------- */
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
    const head = (title) => `【${title}】`;

    if (type === "WC") {
      return `${head(title)}\n이 시설은 아직 API 연결 중입니다.`;
    }

    const rows = searchLocalElev(stationName, type);
    if (!rows.length) {
      return `${head(title)}\n${stationName}역의 ${title} 정보가 없습니다.`;
    }

    const lines = rows.map((r, i) => {
      const nameSeg = r.line ? `${r.name} · ${r.line}` : r.name;
      const statusSeg = r.status ? `(${r.status})` : "";
      const locSeg = r.location ? `\n   • 위치: ${r.location}` : "";
      const oprSeg = r.oprSec ? `\n   • 운행구간: ${r.oprSec}` : "";
      return `#${i + 1} ${nameSeg} ${statusSeg}${locSeg}${oprSeg}`;
    });

    return `${head(title)}\n${lines.join("\n\n")}`;
  }

  /* ---------------------- 지도 + 리스트 ---------------------- */
  const runFacilityMap = async (stationName, type) => {
    const imageUrl = getMapImageUrlFromJson(stationName);
    appendBot("", true, { stationName, imageUrl, type });
    const listText = formatFacilityList({ type, stationName });
    appendBot(listText);
    if (!imageUrl) {
      appendBot(`🗺 ${stationName}역의 지도 이미지를 찾지 못했습니다. station_images.json을 확인해주세요.`);
    }
    // ✅ 리스트 출력 후 메뉴 다시 표시
    append("menu", {});
  };

  /* ---------------------- 경로 탐색 ---------------------- */
  const runPathSearch = useCallback(
    async (start, end, opts = { wheelchair: false }) => {
      appendBot(`🚇 ${start} → ${end} ${opts.wheelchair ? "🦽 휠체어 경로" : "최단경로"}를 탐색합니다...`);
      setLoading(true);
      try {
        const data = await fetchSubwayPath(start, end, !!opts.wheelchair);

        const depRaw = data?.routeSummary?.departure ?? data?.dep ?? data?.start ?? start;
        const arrRaw = data?.routeSummary?.arrival ?? data?.arr ?? data?.end ?? end;

        const clean = (s) => String(s || "").replace(/\(.*?\)/g, "").replace(/역\s*$/u, "").trim();
        const depName = clean(depRaw) || start;
        const arrName = clean(arrRaw) || end;
        setLastPathEnd(arrName);

        const time =
          data?.routeSummary?.estimatedTime ?? data?.totalTime ?? data?.duration ?? data?.time ?? "?";
        const transfers =
          data?.routeSummary?.transfers ?? data?.transfers ?? data?.transferCount ?? 0;

        const sf = data?.stationFacilities || {};
        const ti = Array.isArray(data?.transferInfo) ? data.transferInfo : [];
        const linesToText = (v) =>
          Array.isArray(v) ? v.join("\n") : (typeof v === "string" ? v : "");

        const steps = [];
        if (sf?.departure?.station) {
          const depDesc = linesToText(sf.departure.displayLines) || sf.departure.text || "";
          steps.push(`🚉 출발: ${sf.departure.station}\n${depDesc}`.trim());
        }
        for (const info of ti) {
          const idx = info?.index ?? steps.length;
          const desc =
            linesToText(info?.displayLines) ||
            info?.text ||
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
      }
    },
    [appendBot]
  );

  /* ---------------------- 메시지 렌더 ---------------------- */
  const MessageBubble = ({ item }) => {
    const avatarSize = responsiveWidth(40) + fontOffset * 1.5;
    if (item.role === "system")
      return (
        <View style={styles.systemMessageContainer}>
          <View className="systemBubble" style={styles.systemBubble}>
            <Text style={styles.systemText}>{item.text}</Text>
          </View>
        </View>
      );

    if (item.role === "menu")
      return (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ width: avatarSize, marginRight: 8 }} />
          <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 10, elevation: 2 }}>
            {FAQ_GROUPS.map((group) => (
              <View key={group.title} style={{ marginBottom: 12 }}>
                <View style={{ backgroundColor: group.color, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>{group.title}</Text>
                </View>
                <View style={{ borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                  {group.items.map((it, i) => (
                    <TouchableOpacity
                      key={it.key}
                      style={{ padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderColor: "#eee" }}
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

    const isBot = item.role === "bot";
    if (!isBot)
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
          <Image
            source={BOT_AVATAR}
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          />
          <Text style={styles.botName}>함께타요</Text>
        </View>
        <View style={styles.botBubbleContainer}>
          <View style={[styles.bubble, styles.botBubble]}>
            {item.isMap ? (
              <BarrierFreeMapMini
                stationName={item.mapProps?.stationName || "노원"}
                imageUrl={item.mapProps?.imageUrl || null}
                type={item.mapProps?.type || "TO"}
              />
            ) : (
              <Text style={[styles.messageText, styles.botText]}>{item.text}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ---------------------- onSend ---------------------- */
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
      append("menu", {}); // ✅ 경로 결과 후에도 메뉴 다시 표시
      return;
    }

    if (mode === "facilityAwait" && facilityType) {
      setMode(null);
      await runFacilityMap(t, facilityType); // ✅ 리스트 후 자동으로 메뉴 표시됨
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
