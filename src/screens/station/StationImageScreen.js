import React from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useStationImage } from "../../hooks/useStationImage";

export default function StationImageScreen() {
  const route = useRoute();
  const { stationName } = route.params;
  const { images, loading } = useStationImage(stationName);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (!images.length)
    return (
      <View style={styles.center}>
        <Text>이미지가 없습니다.</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {images.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.title}>
            {item.line}호선 {item.station}
          </Text>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  image: { width: 300, height: 300 },
});
