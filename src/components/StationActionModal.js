import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AccessibilityInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { responsiveFontSize, responsiveHeight } from "../utils/responsive";
import { useFontSize } from "../contexts/FontSizeContext";

export default function StationActionModal({
  visible,
  onClose,
  stationName,
  onViewInfo,
  onSetAsDep,
  onSetAsArr,
}) {
  const { fontOffset } = useFontSize();

  React.useEffect(() => {
    if (visible && Platform.OS === "android") {
      AccessibilityInfo.announceForAccessibility(
        `${stationName} 선택됨. 역 정보 보기, 출발역으로 길찾기, 도착역으로 길찾기 중에서 선택할 수 있습니다.`
      );
    }
  }, [visible, stationName]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text
            style={[
              styles.modalTitle,
              { fontSize: responsiveFontSize(18) + fontOffset },
            ]}
            accessibilityRole="header"
          >
            {stationName} 역
          </Text>

          {/* 버튼 목록 */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: "#14CAC9", shadowColor: "#14CAC9" }, // (CHECK) 테두리/그림자색 (민트)
            ]}
            onPress={onViewInfo}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${stationName} 역 정보 보기 버튼`}
          >
            <Ionicons
              name="information-circle-outline"
              size={24 + fontOffset}
              color="#14CAC9" // (CHECK) 아이콘 색상 (민트)
            />
            <Text
              style={[
                styles.buttonText,
                { fontSize: responsiveFontSize(16) + fontOffset },
                // (CHECK) 텍스트 색상은 styles.buttonText의 기본값(#17171B) 사용
              ]}
            >
              역 정보 보기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: "#0B5FFF", shadowColor: "#0B5FFF" }, // (CHECK) 테두리/그림자색 (파랑)
            ]}
            onPress={onSetAsDep}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`출발역으로 설정 버튼, ${stationName}을 출발역으로`}
          >
            <Ionicons
              name="walk-outline"
              size={24 + fontOffset}
              color="#0B5FFF" // (CHECK) 아이콘 색상 (파랑)
            />
            <Text
              style={[
                styles.buttonText,
                { fontSize: responsiveFontSize(16) + fontOffset },
                // (CHECK) 텍스트 색상은 styles.buttonText의 기본값(#17171B) 사용
              ]}
            >
              출발역으로 길찾기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: "#17171B", shadowColor: "#17171B" }, // (CHECK) 테두리/그림자색 (검정)
            ]}
            onPress={onSetAsArr}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`도착역으로 설정 버튼, ${stationName}을 도착역으로`}
          >
            <Ionicons
              name="flag-outline"
              size={24 + fontOffset}
              color="#17171B" // (CHECK) 아이콘 색상 (검정)
            />
            <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
              도착역으로 길찾기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeArea}
            accessibilityRole="button"
            accessibilityLabel="모달 닫기"
          >
            <Text style={[styles.closeText, { fontSize: responsiveFontSize(16) + fontOffset }]}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "NotoSansKR",
    fontWeight: "700",
    color: "#17171B",
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    width: "100%",
    paddingVertical: responsiveHeight(10),
    marginVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2, // (CHECK) 테두리 두께 강조
    // (CHECK) borderColor 및 shadowColor는 인라인 스타일로 이동
    // (CHECK) iOS 유색 그림자 설정
    shadowOffset: {
      width: 0,
      height: 4, // (CHECK) 그림자 강화
    },
    shadowOpacity: 0.25, // (CHECK) 유색 그림자를 위해 Opacity 강화
    shadowRadius: 5,
    // (CHECK) Android 그림자 설정 (유색 미지원)
    elevation: 5,
  },
  buttonText: {
    color: "#17171B", // (CHECK) 기본 텍스트 색상 (요청사항)
    fontWeight: "700",
    marginLeft: 8,
  },
  closeArea: {
    marginTop: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: "#17171B",
    fontWeight: "700",
  },
});

