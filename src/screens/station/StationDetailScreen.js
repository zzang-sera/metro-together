// src/screens/station/StationDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from "react-native";
import {
  getElevByCode,
  getElevByName,
  prettify,
} from "../../api/elevClient";

export default function StationDetailScreen({ route }) {
  const { stationCode, stationName } = route.params ?? {};
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const raw = stationCode
          ? await getElevByCode(stationCode)
          : await getElevByName(stationName || "");
        if (!alive) return;

        const pretty = prettify(raw);
        setRows(pretty);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "불러오기 실패");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [stationCode, stationName]);

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </SafeAreaView>
    );
  }

  if (err) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={{ color: "red", fontWeight: "600" }}>오류: {err}</Text>
      </SafeAreaView>
    );
  }

  if (rows.length === 0) {
    return (
      <SafeAreaView style={s.center}>
        <Text>표시할 시설 정보가 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={s.header}>
      <Text style={s.headerTitle}>
        {rows[0]?.stationName} ({rows[0]?.stationCode})
      </Text>
      <Text style={s.headerSub}>상세 시설 정보</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={s.row}>
      <Text style={s.rowName}>{item.facilityName}</Text>
      <Text>위치: {item.gate || "-"}</Text>
      <Text>구간: {item.section || "-"}</Text>
      <Text>상태: {item.status || "-"}</Text>
      <Text>
        종류:{" "}
        {item.kind === "EV"
          ? "엘리베이터"
          : item.kind === "ES"
          ? "에스컬레이터"
          : item.kind}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {header}
      <FlatList
        data={rows}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    marginTop: 4,
    color: "#666",
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },
  rowName: {
    fontWeight: "600",
    marginBottom: 4,
  },
});
