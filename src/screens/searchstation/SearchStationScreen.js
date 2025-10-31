import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";
import lineJson from "../../assets/metro-data/metro/line/data-metro-line-1.0.0.json";
import { useFontSize } from "../../contexts/FontSizeContext";
import {
  responsiveFontSize,
  responsiveHeight,
} from "../../utils/responsive";
import StationActionModal from "../../components/StationActionModal";

const allStations = stationJson.DATA;
const lineData = lineJson.DATA;
const BASE_SEARCH_ICON_SIZE = 22;

function getLineColor(lineNum) {
  const lineInfo = lineData.find((l) => l.line === lineNum);
  return lineInfo ? lineInfo.color : "#666666";
}

function getTextColorForBackground(hexColor) {
  if (!hexColor) return "#FFFFFF";
  try {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#17171B" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
}

function findStationCodeBy(name, line) {
  const realName = name === "서울역" ? "서울" : name;
  const hit = allStations.find((s) => s?.name === realName && s?.line === line);
  const code = String(
    hit?.station_cd ?? hit?.STN_CD ?? hit?.code ?? hit?.stationCode ?? ""
  ).trim();
  return code;
}

const SearchStationScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const matchingStations = allStations.filter((station) =>
      station.name.startsWith(q)
    );
    const map = new Map();
    matchingStations.forEach((s) => {
      const display = s.name === "서울" ? "서울역" : s.name;
      if (map.has(display)) {
        map.get(display).lines.push(s.line);
      } else {
        map.set(display, { name: display, lines: [s.line] });
      }
    });
    return Array.from(map.values());
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20 + fontOffset / 2} color="#17171B" />
        <TextInput
          style={[
            styles.input,
            { fontSize: responsiveFontSize(18) + fontOffset },
          ]}
          placeholder="역 이름을 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(i) => i.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => {
              setSelectedStation(item);
              setModalVisible(true);
            }}
            accessibilityLabel={`${item.name} 역, ${item.lines.join(", ")}`}
          >
            <Ionicons name="location-outline" size={24 + fontOffset / 2} />
            <Text
              style={[
                styles.stationName,
                { fontSize: responsiveFontSize(18) + fontOffset },
              ]}
            >
              {item.name}
            </Text>
            <View style={styles.lineContainer}>
              {item.lines.map((l) => {
                const color = getLineColor(l);
                const textColor = getTextColorForBackground(color);
                return (
                  <View
                    key={l}
                    style={[
                      styles.lineCircle,
                      {
                        backgroundColor: color,
                        width: BASE_SEARCH_ICON_SIZE + fontOffset,
                        height: BASE_SEARCH_ICON_SIZE + fontOffset,
                        borderRadius:
                          (BASE_SEARCH_ICON_SIZE + fontOffset) / 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.lineText,
                        { color: textColor, fontSize: 12 + fontOffset },
                      ]}
                    >
                      {l.replace("호선", "")}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        )}
      />

      {selectedStation && (
        <StationActionModal
          visible={modalVisible}
          stationName={selectedStation.name}
          onClose={() => setModalVisible(false)}
          onViewInfo={() => {
            setModalVisible(false);
            const firstLine = selectedStation.lines[0];
            const code = findStationCodeBy(selectedStation.name, firstLine);
            navigation.navigate("MainStack", {
              screen: "StationDetail",
              params: {
                stationName: selectedStation.name,
                lines: selectedStation.lines,
                stationCode: code,
              },
            });
          }}
          onSetAsDep={() => {
            setModalVisible(false);
            navigation.navigate("PathFinderStack", {
              screen: "PathFinderHome",
              params: { selectedDep: selectedStation.name },
            });
          }}
          onSetAsArr={() => {
            setModalVisible(false);
            navigation.navigate("PathFinderStack", {
              screen: "PathFinderHome",
              params: { selectedArr: selectedStation.name },
            });
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    margin: 16,
    paddingHorizontal: 12,
    minHeight: responsiveHeight(5.5),
  },
  input: { flex: 1, fontWeight: "bold", marginLeft: 8 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#C9CDD1",
  },
  stationName: { flex: 1, fontWeight: "bold", color: "#17171B" },
  lineContainer: { flexDirection: "row", gap: 6 },
  lineCircle: { justifyContent: "center", alignItems: "center" },
  lineText: { fontWeight: "bold" },
});

export default SearchStationScreen;
