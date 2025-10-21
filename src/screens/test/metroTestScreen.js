import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { getEscalatorStatus } from "../../api/metro/metroAPI";
import { SUPABASE_URL } from "../../constants/constants";

export default function MetroTestScreen() {
  const [loading, setLoading] = useState(true);
  const [escalators, setEscalators] = useState([]);

  useEffect(() => {
    console.log("🚀 환경변수 URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log("📡 SUPABASE_URL:", SUPABASE_URL);

    (async () => {
      try {
        const data = await getEscalatorStatus();
        setEscalators(data);
        console.log("✅ Supabase API 호출 성공:", data.length, "건");
      } catch (e) {
        console.error("❌ API fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>지하철 에스컬레이터 정보 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        ✅ 불러온 데이터 ({escalators.length}개)
      </Text>
      {escalators.slice(0, 3).map((item, idx) => (
        <Text key={idx}>
          {item.stationName} - {item.elevatorName} ({item.status})
        </Text>
      ))}
    </View>
  );
}
