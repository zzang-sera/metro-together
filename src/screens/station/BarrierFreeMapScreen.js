import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { getStationImageByName, getEscalatorStatusByName } from "../../api/metro/metroAPI";
import { useRoute } from "@react-navigation/native";

/**
 * BarrierFreeMapScreen (Segmented Control Style)
 * - 내부 JSON 이미지 데이터 사용
 * - 버튼 대신 상단 탭형 Segment UI
 */
export default function BarrierFreeMapScreen() {
  const route = useRoute();
  const { stationName = "서울역" } = route.params || {}; // 기본값
  const [imageData, setImageData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [selectedType, setSelectedType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // ✅ 데이터 불러오기
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const imgRes = await getStationImageByName(stationName);
        setImageData(imgRes[0] || null);

        const facilityRes = await getEscalatorStatusByName(stationName);
        setFacilities(facilityRes || []);
      } catch (e) {
        console.error("🚨 BarrierFreeMapScreen error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stationName]);

  // ✅ 필터링
  const filteredFacilities =
    selectedType === "ALL"
      ? facilities
      : facilities.filter((f) => f.type === selectedType);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14CAC9" />
        <Text style={{ marginTop: 10 }}>불러오는 중...</Text>
      </View>
    );
  }

  if (!imageData) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#999" }}>이미지를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 제목 */}
      <Text style={styles.title}>{stationName} 역사 안내도</Text>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        {["ALL", "EV", "ES"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.segmentButton, selectedType === type && styles.segmentSelected]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.segmentText,
                selectedType === type && styles.segmentTextActive,
              ]}
            >
              {type === "ALL"
                ? "전체"
                : type === "EV"
                ? "엘리베이터"
                : "에스컬레이터"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 이미지 및 시설 리스트 */}
      <ScrollView contentContainerStyle={{ alignItems: "center" }}>
        <Image source={imageData.image} style={styles.mapImage} resizeMode="contain" />

        {filteredFacilities.length > 0 ? (
          <View style={styles.facilityList}>
            {filteredFacilities.map((f, i) => (
              <View key={i} style={styles.facilityCard}>
                <Text style={styles.facilityText}>
                  {f.type === "EV" ? "🚪 엘리베이터" : "↕ 에스컬레이터"} - {f.position}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>시설 정보가 없습니다.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────
// 스타일
// ──────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#17171B",
  },
  segmentContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#E3F6F5",
    borderRadius: 25,
    marginVertical: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentSelected: {
    backgroundColor: "#14CAC9",
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  segmentTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  mapImage: {
    width: "95%",
    height: 400,
    borderRadius: 12,
    marginTop: 5,
  },
  facilityList: {
    width: "95%",
    marginTop: 15,
  },
  facilityCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    elevation: 2,
  },
  facilityText: {
    fontSize: 15,
    color: "#333",
  },
  noData: {
    marginTop: 20,
    color: "gray",
  },
});
