import React, { useState, useMemo, useEffect } from "react"; // ✅ useEffect 추가
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  AccessibilityInfo, // ✅ AccessibilityInfo 추가
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
  // ✅ 스크린리더 상태 state 추가
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // ✅ 스크린리더 상태 감지
  useEffect(() => {
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };
    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        setIsScreenReaderEnabled(isEnabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

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

  // ✅ 안내 메시지 스타일
  const noticeBoxStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16, // searchContainer와 동일한 여백
    marginTop: 0,
    marginBottom: 8,
  };
  
  const noticeTextStyle = {
    flex: 1,
    color: '#17171B',
    fontWeight: '700',
    fontFamily: 'NotoSansKR', 
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20 + fontOffset / 2}
          color="#17171B"
          accessibilityHidden={true} // ✅ 장식용 아이콘 숨김
        />
        <TextInput
          style={[
            styles.input,
            { fontSize: responsiveFontSize(18) + fontOffset },
          ]}
          placeholder="역 이름을 입력하세요"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          accessibilityLabel="역 이름 검색" // ✅ 입력창 라벨
          accessibilityHint="역 이름 초성을 입력하여 검색할 수 있습니다."
        />
      </View>

      {/* ✅ 음성안내 시 스크롤 안내 */}
      {isScreenReaderEnabled && searchResults.length > 0 && (
        <View style={noticeBoxStyle} accessibilityRole="alert">
          <Ionicons
            name="information-circle-outline"
            size={responsiveFontSize(22) + fontOffset / 2}
            color="#0B5FFF"
            style={{ marginRight: 8 }}
            accessibilityHidden={true}
          />
          <Text style={[noticeTextStyle, { fontSize: responsiveFontSize(15) + fontOffset }]}>
            화면을 내리거나 올리려면 두 손가락으로 미세요.
          </Text>
        </View>
      )}

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
            accessibilityHint="탭하여 출발/도착 설정 또는 역 정보 보기"
          >
            <Ionicons
              name="location-outline"
              size={24 + fontOffset / 2}
              accessibilityHidden={true} // ✅ 장식용 아이콘 숨김
            />
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
                const lineNum = l.replace("호선", "");
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
                      accessibilityLabel={`${lineNum}호선`} // ✅ 호선 라벨
                    >
                      {lineNum}
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