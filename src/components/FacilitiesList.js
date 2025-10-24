// src/components/FacilitiesList.js
import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";

export default function FacilitiesList({ items, loading, error }) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.text}>불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.text, styles.error]}>{error}</Text>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>표시할 항목이 없어요</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 20 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.desc && <Text style={styles.desc}>{item.desc}</Text>}
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === "사용가능" || item.status === "정상"
                ? styles.ok
                : /중/.test(item.status)
                ? styles.warn
                : styles.neutral,
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  text: { color: "#333", fontWeight: "600" },
  error: { color: "#B3261E" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginHorizontal: 12,
  },
  title: { fontWeight: "bold", color: "#0f172a" },
  desc: { color: "#334155", marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  ok: { backgroundColor: "#d4f5f2" },
  warn: { backgroundColor: "#ffe4cc" },
  neutral: { backgroundColor: "#e5e7eb" },
  statusText: { fontWeight: "bold", color: "#0f172a" },
});
