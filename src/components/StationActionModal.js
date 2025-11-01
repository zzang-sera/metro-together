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

import CustomButton from "./CustomButton";

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

  const featureColor = "#17171B"; 
  const outlineColor = "#17171B"; 

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
          <CustomButton
            type="feature" 
            onPress={onViewInfo}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${stationName} 역 정보 보기 버튼`}
            style={styles.customButtonMargin} 
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="information-circle-outline"
                size={24 + fontOffset}
                color={featureColor} 
              />
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: responsiveFontSize(16) + fontOffset, color: featureColor },
                ]}
              >
                역 정보 보기
              </Text>
            </View>
          </CustomButton>

          <CustomButton
            type="outline" 
            onPress={onSetAsDep}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`출발역으로 설정 버튼, ${stationName}을 출발역으로`}
            style={styles.customButtonMargin} 
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="walk-outline"
                size={24 + fontOffset}
                color={outlineColor} 
              />
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: responsiveFontSize(16) + fontOffset, color: outlineColor },
                ]}
              >
                출발역으로 길찾기
              </Text>
            </View>
          </CustomButton>

          <CustomButton
            type="outline" 
            onPress={onSetAsArr}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`도착역으로 설정 버튼, ${stationName}을 도착역으로`}
            style={styles.customButtonMargin} 
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="flag-outline"
                size={24 + fontOffset}
                color={outlineColor} 
              />
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: responsiveFontSize(16) + fontOffset, color: outlineColor },
                ]}
              >
                도착역으로 길찾기
              </Text>
            </View>
          </CustomButton>

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
  
  customButtonMargin: {
    marginBottom: 16, 
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
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