import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  AccessibilityInfo, 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import stationJson from "../../assets/metro-data/metro/station/data-metro-station-1.0.0.json";
import lineJson from "../../assets/metro-data/metro/line/data-metro-line-1.0.0.json";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
} from "../../utils/responsive";
import { useFontSize } from "../../contexts/FontSizeContext";
import StationActionModal from "../../components/StationActionModal";

const stationData = stationJson.DATA;
const lineData = lineJson.DATA;
const BASE_NEARBY_ICON_SIZE = 22;

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

const NearbyStationsScreen = () => {
  const { fontOffset } = useFontSize();
  const navigation = useNavigation();
  const [nearbyStations, setNearbyStations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

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

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("위치 정보 접근 권한이 거부되었습니다.");
        setIsLoading(false);
        return;
      }
      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;
        const stationsWithDistance = stationData.map((station) => ({
          ...station,
          distance: getDistance(latitude, longitude, station.lat, station.lng),
        }));
        const grouped = {};
        stationsWithDistance.forEach((s) => {
          if (!grouped[s.name]) {
            grouped[s.name] = {
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              lines: s.line ? [s.line] : [],
              distance: s.distance,
              stationCode: String(
                s.station_cd || s.STN_CD || s.code || s.stationCode || ""
              ).trim(),
            };
          } else {
            if (s.line && !grouped[s.name].lines.includes(s.line)) {
              grouped[s.name].lines.push(s.line);
            }
            if (s.distance < grouped[s.name].distance) {
              grouped[s.name].distance = s.distance;
              grouped[s.name].lat = s.lat;
              grouped[s.name].lng = s.lng;
            }
          }
        });
        const sorted = Object.values(grouped).sort(
          (a, b) => a.distance - b.distance
        );
        setNearbyStations(sorted.slice(0, 10));
      } catch (error) {
        setErrorMsg("현재 위치를 가져오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text
          style={[
            styles.loadingText,
            { fontSize: responsiveFontSize(16) + fontOffset },
          ]}
          accessibilityRole="alert" 
        >
          주변 역을 찾고 있습니다...
        </Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text
          style={[
            styles.errorText,
            { fontSize: responsiveFontSize(16) + fontOffset },
          ]}
          accessibilityRole="alert" 
        >
          {errorMsg}
        </Text>
      </View>
    );
  }

  const handleStationPress = (item) => {
    setSelectedStation(item);
    setModalVisible(true);
  };

  const noticeBoxStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: responsiveWidth(16),
  };
  
  const noticeTextStyle = {
    flex: 1,
    color: '#17171B',
    fontWeight: '700',
    fontFamily: 'NotoSansKR', 
  };


  return (
    <View style={styles.container}>
      {/* 음성안내 시 스크롤 안내 */}
      {isScreenReaderEnabled && nearbyStations.length > 0 && (
        <View style={[noticeBoxStyle, { marginTop: 8 }]} accessibilityRole="alert">
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
        data={nearbyStations}
        keyExtractor={(item) => `${item.name}-${item.lines.join("-")}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stationCard}
            activeOpacity={0.85}
            onPress={() => handleStationPress(item)}
            accessibilityLabel={`${item.name} 역, ${item.distance.toFixed(
              1
            )} 킬로미터 거리, ${item.lines.join(", ")}`} 
            accessibilityHint="탭하여 출발/도착 설정 또는 역 정보 보기" 
          >
            <View style={styles.leftContent}>
              <View style={styles.lineContainer}>
                {item.lines.map((line) => {
                  const color = getLineColor(line);
                  const textColor = getTextColorForBackground(color);
                  const lineNum = line.replace("호선", ""); 
                  return (
                    <View
                      key={line}
                      style={[
                        styles.lineBadge,
                        {
                          backgroundColor: color,
                          width: BASE_NEARBY_ICON_SIZE + fontOffset,
                          height: BASE_NEARBY_ICON_SIZE + fontOffset,
                          borderRadius:
                            (BASE_NEARBY_ICON_SIZE + fontOffset) / 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lineBadgeText,
                          { color: textColor, fontSize: 12 + fontOffset },
                        ]}
                        accessibilityLabel={`${lineNum}호선`} 
                      >
                        {lineNum}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View>
                <Text
                  style={[
                    styles.stationName,
                    { fontSize: responsiveFontSize(18) + fontOffset },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.distanceText,
                    { fontSize: responsiveFontSize(15) + fontOffset },
                  ]}
                >
                  {item.distance.toFixed(1)} km
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={28 + fontOffset}
              color="#595959"
              accessibilityHidden={true} 
            />
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
            navigation.navigate("MainStack", {
              screen: "StationDetail",
              params: {
                stationName: selectedStation.name,
                lines: selectedStation.lines,
                stationCode: selectedStation.stationCode,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#333", fontWeight: "700", marginTop: 10 },
  errorText: { color: "#595959", fontWeight: "700" },
  stationCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(16),
    marginVertical: responsiveHeight(6),
    marginHorizontal: responsiveWidth(16), 
    borderRadius: 40,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftContent: { flexDirection: "row", alignItems: "center" },
  lineContainer: { flexDirection: "row", marginRight: 10, gap: 6 },
  lineBadge: { justifyContent: "center", alignItems: "center" },
  lineBadgeText: { fontWeight: "700" },
  stationName: { color: "#17171B", fontWeight: "700" },
  distanceText: { color: "#595959", fontWeight: "700" },
});

export default NearbyStationsScreen;