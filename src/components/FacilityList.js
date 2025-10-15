// src/components/FacilityList.js
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FacilityList({ items, rowFontSize = 14, onItemPress }) {
  if (items === null) {
    return (
      <View style={styles.loadingRow}>
        <Ionicons name="sync" size={16} color="#475569" />
        <Text style={styles.loadingText}>遺덈윭?ㅻ뒗 以묅?/Text>
      </View>
    );
  }
  if (!items || items.length === 0) {
    return <Text style={styles.emptyText}>?쒖떆????ぉ???놁뼱??/Text>;
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            {item.status === "怨좎옣" ? (
              <View style={[styles.statusPill, styles.bad]}>
                <Text style={styles.statusPillText}>怨좎옣</Text>
              </View>
            ) : (
              <Ionicons name="location-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.rowTitle, { fontSize: rowFontSize }]}>{item.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9aa3af" />
        </View>
      )}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  rowTitle: { color: "#111827", fontWeight: "bold" },
  rowDivider: { height: 1, backgroundColor: "#edf2f7" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginRight: 6 },
  bad: { backgroundColor: "#FECACA" },
  statusPillText: { color: "#7A0B0B", fontWeight: "bold", fontSize: 12 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  loadingText: { color: "#475569", fontWeight: "bold" },
  emptyText: { color: "#64748b", fontWeight: "bold", paddingVertical: 10, textAlign: "center" },
});
