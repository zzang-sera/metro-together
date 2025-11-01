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
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import { fetchSubwayPath } from "../pathfinder/PathFinderScreen";
import BarrierFreeMapMini from "../../components/BarrierFreeMapMini";

// 로컬 데이터
import elevLocalJson from "../../assets/metro-data/metro/elevator/서울교통공사_교통약자_이용시설_승강기_가동현황.json";
import stationImages from "../../assets/metro-data/metro/station/station_images.json";

const BOT_AVATAR = require("../../assets/brand-icon.png");

/* ---------------------- 섹션 정의 (UI 변경 없음) ---------------------- */
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
const koStatus = (v = "") => (v === "Y" ? "사용가능" : v === "N" ? "중지" : v || "상태미상");
const normalizeLine = (line = "") => {
  const m = String(line).match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}호선` : String(line || "");
};

/* ---------------------- 엘리베이터 인덱싱 ---------------------- */
const ELEV_ROWS = pickArray(elevLocalJson).map((raw) => {
  const stnNm = raw.stn_nm ?? raw.STN_NM ?? raw.station_nm ?? raw.name ?? "";
  return {
    code: String(raw.stn_cd ?? raw.STN_CD ?? "").trim(),
    name: sanitizeName(stnNm),
    location: raw.instl_pstn ?? "",
    status: koStatus(raw.use_yn ?? ""),
    kind: raw.elvtr_se ?? "",
    line: normalizeLine(raw.line ?? ""),
  };
});
const ELEV_BY_NAME = new Map();
for (const r of ELEV_ROWS) {
  if (!r.name) continue;
  const arr = ELEV_BY_NAME.get(r.name) || [];
  arr.push(r);
  ELEV_BY_NAME.set(r.name, arr);
}
const searchLocalElev = (arg) => ELEV_BY_NAME.get(sanitizeName(arg)) || [];

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
  const [wheelchair, setWheelchair] = useState(false); // 휠체어 모드
  const [mode, setMode] = useState(null); // pathStartAwait / pathEndAwait / wheelchairAsk / facilityAwait ...
  const [pathStart, setPathStart] = useState("");
  const [facilityType, setFacilityType] = useState(null);
  const [lastPathEnd, setLastPathEnd] = useState("노원"); // 최근 도착역
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

  /* ---------------------- 시설 리스트 포맷터 (텍스트만 생성) ---------------------- */
  function formatFacilityList({ type, stationName }) {
    const head = (title) => `【${title}】`;

    // 1) 엘리베이터: 로컬 JSON에서 실제 데이터 출력
    if (type === "EV") {
      const rows = searchLocalElev(stationName);
      if (!rows.length) return `${head("엘리베이터")}\n해당 역의 로컬 데이터가 없습니다.`;
      const top = rows.slice(0, 8); // 너무 길어지지 않게 제한
      const lines = top.map((r, i) => {
        const nameSeg = r.line ? `${r.name} · ${r.line}` : r.name;
        const statusSeg = r.status ? `(${r.status})` : "";
        const locSeg = r.location ? `\n   • 위치: ${r.location}` : "";
        return `#${i + 1} ${nameSeg} ${statusSeg}${locSeg}`;
      });
      const more = rows.length > top.length ? `\n…외 ${rows.length - top.length}건` : "";
      return `${head("엘리베이터")}\n${lines.join("\n\n")}${more}`;
    }

    // 2) 그 외 타입(ES/TO/DT/WL/NU/LO): 현재 로컬 JSON이 없으므로 안내만
    const titleMap = {
      ES: "에스컬레이터",
      TO: "화장실",
      DT: "장애인 화장실",
      WL: "휠체어 리프트",
      WC: "휠체어 급속충전",
      VO: "음성유도기",
      NU: "수유실",
      LO: "보관함",
    };
    const title = titleMap[type] || "시설";
    return `${head(title)}\n해당 시설의 로컬 데이터가 아직 연결되지 않았습니다.\n지도에서 위치를 확인해주세요.`;
  }

  /* ---------------------- 지도 + 리스트 설명 (요구사항 핵심) ---------------------- */
  const runFacilityMap = async (stationName, type) => {
    const imageUrl = getMapImageUrlFromJson(stationName);

    // 1) 사진(지하철 안내도/레이아웃) 표시
    appendBot("", true, { stationName, imageUrl, type });

    // 2) 사진 아래에 텍스트 리스트 설명 표시
    const listText = formatFacilityList({ type, stationName });
    appendBot(listText);

    // 3) 사진을 못 찾았을 때도 친절 메시지
    if (!imageUrl) {
      appendBot(`🗺 ${stationName}역의 지도 이미지를 찾지 못했습니다. station_images.json을 확인해주세요.`);
    }
  };

  /* ---------------------- 경로 탐색 (기존 동작 유지) ---------------------- */
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

  /* ---------------------- 메시지 ---------------------- */
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
      return;
    }

    if (mode === "facilityAwait" && facilityType) {
      setMode(null);
      await runFacilityMap(t, facilityType); // 사진 + 리스트 설명
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
