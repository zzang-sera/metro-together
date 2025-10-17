// src/screens/station/StationFacilitiesScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getMetroFacilitiesByStation } from "../../api/metroAPI";

export default function StationFacilitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { stationName } = route.params || {};

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stationName) return;
    (async () => {
      setLoading(true);
      const data = await getMetroFacilitiesByStation(stationName);
      setFacilities(data);
      setLoading(false);
    })();
  }, [stationName]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#21C9C6" />
        <Text style={styles.text}>시설 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!facilities.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>해당 역의 시설 정보가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#003F40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stationName} 시설 정보</Text>
      </View>

      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.title}>
                {item.type} — {item.facilityName}
              </Text>
              <Text style={styles.detail}>
                구간: {item.section} | 위치: {item.position}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                item.status === "정상" ? styles.ok : styles.warn,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === "정상" ? styles.okText : styles.warnText,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#003F40" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 15, color: "#374151", marginTop: 10 },
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardContent: { flex: 1, paddingRight: 8 },
  title: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  detail: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  ok: { backgroundColor: "#DCFCE7" },
  warn: { backgroundColor: "#FEF3C7" },
  okText: { color: "#166534", fontWeight: "bold" },
  warnText: { color: "#92400E", fontWeight: "bold" },
});
