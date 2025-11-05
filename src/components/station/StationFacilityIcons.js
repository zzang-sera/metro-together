import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";

const MINT = "#21C9C6";
const INK = "#003F40";

export default function StationFacilityIcons({ stationCode, stationName, line }) {
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  const facilities = [
    {
      id: "EV",
      label: "엘리베이터",
      icon: <Ionicons name="cube-outline" size={42} color={MINT} />,
    },
    {
      id: "ES",
      label: "에스컬레이터",
      icon: <Ionicons name="swap-vertical-outline" size={42} color={MINT} />,
    },
    {
      id: "LO",
      label: "물품보관함",
      icon: <Ionicons name="lock-closed-outline" size={42} color={MINT} />,
    },
    {
      id: "RR",
      label: "화장실",
      icon: <Ionicons name="male-female-outline" size={42} color={MINT} />,
    },
    {
      id: "NR",
      label: "수유실",
      icon: <FontAwesome5 name="baby" size={38} color={MINT} />,
    },
    {
      id: "VC",
      label: "음성유도기",
      icon: <MaterialCommunityIcons name="volume-high" size={42} color={MINT} />,
    },
    {
      id: "WL",
      label: "휠체어리프트",
      icon: <MaterialCommunityIcons name="wheelchair-accessibility" size={42} color={MINT} />,
    },
  ];

  const handlePress = (type) => {
    navigation.navigate("StationFacilities", {
      stationCode,
      stationName,
      line,
      type,
    });
  };

  return (
    <View style={styles.container}>
      {facilities.map((f) => (
        <TouchableOpacity
          key={f.id}
          style={styles.iconButton}
          onPress={() => handlePress(f.id)}
        >
          {f.icon}
          <Text
            style={[
              styles.iconLabel,
              { fontSize: responsiveFontSize(13) + fontOffset },
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 14,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 110,
    height: 110,
    backgroundColor: "#F1FAFA",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  iconLabel: { color: INK, fontWeight: "bold", marginTop: 6, textAlign: "center" },
});
