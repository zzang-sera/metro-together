// src/components/station/StationHeader.js
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { responsiveFontSize } from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

const MINT = "#21C9C6";
const INK = "#003F40";

export default function StationHeader({ stationName, line, stationCode, isFavorite, setIsFavorite }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { fontOffset } = useFontSize();
  const currentUser = auth.currentUser;

  const handleFavoriteToggle = async () => {
    if (!currentUser || !stationCode) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      if (isFavorite) {
        await updateDoc(userDocRef, { favorites: arrayRemove(stationCode) });
      } else {
        await updateDoc(userDocRef, { favorites: arrayUnion(stationCode) });
      }
      setIsFavorite((prev) => !prev);
    } catch (err) {
      console.error("즐겨찾기 토글 오류:", err);
    }
  };

  const Header = useMemo(
    () => (
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24 + fontOffset / 2} color={INK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {line ? (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { fontSize: responsiveFontSize(12) + fontOffset }]}>
                {line}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
            {stationName || "역명"}
          </Text>
        </View>

        <TouchableOpacity onPress={handleFavoriteToggle} style={styles.starBtn}>
          <Ionicons
            name={isFavorite ? "star" : "star-outline"}
            size={24 + fontOffset / 2}
            color={isFavorite ? "#FFD700" : INK}
          />
        </TouchableOpacity>
      </View>
    ),
    [stationName, line, fontOffset, insets.top, isFavorite]
  );

  return Header;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#F9F9F9", 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerBtn: { width: 36, alignItems: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    backgroundColor: "#E6F7F7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: INK, fontWeight: "bold" },
  headerTitle: { color: INK, fontWeight: "bold" },
  starBtn: { padding: 6 },
});
