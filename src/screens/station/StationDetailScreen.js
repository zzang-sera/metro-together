// src/screens/station/StationDetailScreen.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function StationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { stationCode, stationName, line } = route.params || {};

  const handleFacilityPress = () => {
    navigation.navigate("StationFacilities", {
      stationCode,
      stationName,
      line,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#003F40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stationName || "역 정보"}</Text>
      </View>

      {/* 기본 정보 */}
      <View style={styles.section}>
        <Text style={styles.label}>노선</Text>
        <Text style={styles.value}>{line || "-"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>역 코드</Text>
        <Text style={styles.value}>{stationCode || "-"}</Text>
      </View>

      {/* 시설 보기 버튼 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.facilityButton} onPress={handleFacilityPress}>
          <Ionicons name="construct-outline" size={18} color="#fff" />
          <Text style={styles.facilityText}>이 역의 이동시설 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 설명 */}
      <View style={styles.section}>
        <Text style={styles.desc}>
          선택한 역의 엘리베이터·에스컬레이터 등 이동시설 정보를 실시간으로 확인할 수 있습니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#003F40" },
  section: { marginBottom: 16 },
  label: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  value: { fontSize: 16, color: "#111827", fontWeight: "600" },
  facilityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#21C9C6",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: "center",
    gap: 6,
  },
  facilityText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  desc: { color: "#374151", fontSize: 13, lineHeight: 18 },
});
