// src/screens/chatbot/ChatBotScreen.js
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { getElevStatus } from "../../api/seoulElev"; // 경로 주의: screens/chatbot -> api

const SEOUL_KEY = Constants.expoConfig?.extra?.SEOUL_KEY;

export default function ChatBotScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: "boot", role: "bot", text: "안녕하세요! /elev [역코드 또는 역명] 으로 엘리베이터 상태를 조회해보세요.\n예) /elev 0150  또는  /elev 종각" },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const append = useCallback((role, text) => {
    setMessages(prev => [...prev, { id: String(Date.now() + Math.random()), role, text }]);
    setTimeout(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    }, 50);
  }, []);

  const appendUser = useCallback((text) => append("user", text), [append]);
  const appendBot = useCallback((text) => append("bot", text), [append]);

  const handleElevCommand = useCallback(async (arg) => {
    if (!SEOUL_KEY) {
      appendBot("⚠️ SEOUL_KEY가 설정되지 않았습니다. app.config.js/app.json 의 extra에 SEOUL_KEY를 넣어주세요.");
      return;
    }
    if (!arg) {
      appendBot("사용법: /elev [역코드 또는 역명]\n예) /elev 0150  또는  /elev 종각");
      return;
    }

    setLoading(true);
    appendBot("🔎 엘리베이터 상태 조회 중…");

    try {
      const { ok, rows, meta, error } = await getElevStatus(SEOUL_KEY, arg, { start: 1, end: 50 });

      if (!ok) {
        if (error === "NO_DATA_OR_SERVER") {
          appendBot("⚠️ 데이터가 없습니다. 역명/역코드를 확인하거나 잠시 후 다시 시도해주세요. (0150↔150, 역명 철자 확인)");
        } else {
          appendBot(`⚠️ 오류가 발생했습니다: ${String(error)}`);
        }
        return;
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        appendBot("결과가 0건입니다. 다른 입력으로 시도해보세요. (예: 0150 ↔ 150, 역명 철자 확인)");
        return;
      }

      // 최대 3건 미리보기
      const preview = rows.slice(0, 3).map((r, i) => {
        const stName = r.STATION_NM || r.STATION_NAME || r.stNm || r.staNm || r.SBWY_STN_NM || "역명정보없음";
        const code   = r.STATION_CD || r.STATION_CODE || r.stCd || r.staCd || r.SBWY_STN_CD || "";
        const elevId = r.ELVT_ID || r.ELEVATOR_ID || r.elevId || r.FACILITY_ID || "";
        const status = r.STATUS || r.USE_YN || r.OPER_ST || r.state || r.RUN_YN || r.OPER_YN || "상태미상";
        const place  = r.LOCATION || r.LOC || r.POS || r.place || r.INOUT_DIV || "";

        return `#${i + 1} ${stName}${code ? `(${code})` : ""}  •  ${place ? `${place}  •  ` : ""}${elevId ? `ID:${elevId}  •  ` : ""}상태: ${status}`;
      });

      const more = rows.length > 3 ? `\n…외 ${rows.length - 3}건` : "";
      appendBot(`조회 파라미터: ${meta?.usedParam ?? "(알수없음)"}\n${preview.join("\n")}${more}`);
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
    return false; // 다른 명령은 여기서 false
  }, [handleElevCommand]);

  const onSend = useCallback(async () => {
    const t = input.trim();
    if (!t) return;

    appendUser(t);
    setInput("");

    // 명령 처리
    const handled = await handleCommand(t);
    if (handled) return;

    // 일반 대화(기존 로직이 있다면 여기에 연결)
    appendBot("명령을 인식하지 못했어요. 사용 가능: /elev [역코드 또는 역명]");
  }, [input, appendUser, appendBot, handleCommand]);

  const renderItem = ({ item }) => (
    <View style={[styles.bubble, item.role === "bot" ? styles.bot : styles.user]}>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
      />

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" />
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="/elev 0150  또는  /elev 종각"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
          <Text style={styles.sendTxt}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101114" },
  bubble: { padding: 10, borderRadius: 10, marginVertical: 6, maxWidth: "90%" },
  bot: { alignSelf: "flex-start", backgroundColor: "#22252b" },
  user: { alignSelf: "flex-end", backgroundColor: "#2f6fed" },
  text: { color: "#fff", lineHeight: 20 },
  inputBar: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderTopColor: "#22252b", backgroundColor: "#14161a" },
  input: { flex: 1, backgroundColor: "#1b1e23", color: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  sendBtn: { marginLeft: 8, paddingHorizontal: 14, justifyContent: "center", alignItems: "center", backgroundColor: "#2f6fed", borderRadius: 8 },
  sendTxt: { color: "#fff", fontWeight: "600" },
  loading: { position: "absolute", top: 8, alignSelf: "center", padding: 6, backgroundColor: "#00000066", borderRadius: 8 },
});
