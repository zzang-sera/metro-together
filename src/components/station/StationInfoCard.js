import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";

const INK = "#003F40";

export default function StationInfoCard({ line, stationCode }) {
  const { fontOffset } = useFontSize();

  return (
    <View style={styles.infoBox}>
      <Text style={[styles.lineText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
        {line}
      </Text>
      <Text style={[styles.codeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
        코드: {stationCode}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoBox: { alignItems: "center", marginTop: 16, marginBottom: 30 },
  lineText: { color: INK, fontWeight: "600" },
  codeText: { color: "#6B7280", marginTop: 4 },
});
