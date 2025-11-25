// src/components/UserTypeSelectorButton.js
import React, { useState } from "react";
import {
  Text,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useFontSize } from "../contexts/FontSizeContext";
import { useUserType } from "../contexts/UserTypeContext";
import { USER_TYPES, USER_TYPE_LABELS } from "../constants/userType";
import { responsiveFontSize } from "../utils/responsive";
import CustomButton from "./CustomButton";

function UserTypeSelectorButton() {
  const { fontOffset } = useFontSize();
  const { userType, setUserType } = useUserType();
  const [visible, setVisible] = useState(false);

  const currentLabel = USER_TYPE_LABELS[userType] || "일반";

  const descText =
    userType === USER_TYPES.WHEELCHAIR
      ? "휠체어 경로가 기본값으로 적용됩니다."
      : userType === USER_TYPES.VISUAL
      ? "시각 의존도를 최소화한 화면 구성이 우선 적용됩니다."
      : "기본 지하철 이용 모드입니다.";

  const handleSelect = async (type) => {
    await setUserType(type);
    setVisible(false);
  };

  return (
    <>
      {/* 🔹 일반 CustomButton처럼 보이는 버튼 */}
      <CustomButton
        type="outline"
        title={`이용자 유형 설정 (${currentLabel})`}
        onPress={() => setVisible(true)}
        accessibilityLabel={`현재 ${currentLabel} 모드. 변경하려면 누르세요.`}
      />

      {/* 🔹 모달 */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContainer}>
            <Text
              style={[
                styles.modalTitle,
                { fontSize: responsiveFontSize(18) + fontOffset },
              ]}
            >
              이용자 유형 선택
            </Text>

            <Text
              style={[
                styles.modalDesc,
                { fontSize: responsiveFontSize(14) + fontOffset },
              ]}
            >
              본인에게 맞는 이용자 유형을 선택하면{'\n'}
              앱이 환경을 자동으로 조정합니다.
            </Text>

            <View style={{ gap: 8 }}>
              <CustomButton
                type={userType === USER_TYPES.DEFAULT ? "feature" : "outline"}
                title="일반 사용자"
                onPress={() => handleSelect(USER_TYPES.DEFAULT)}
              />
              <CustomButton
                type={userType === USER_TYPES.VISUAL ? "feature" : "outline"}
                title="시각 약자"
                onPress={() => handleSelect(USER_TYPES.VISUAL)}
              />
              <CustomButton
                type={userType === USER_TYPES.WHEELCHAIR ? "feature" : "outline"}
                title="휠체어 이용자"
                onPress={() => handleSelect(USER_TYPES.WHEELCHAIR)}
              />
            </View>

            <View style={styles.currentBox}>
              <Text
                style={[
                  styles.currentLabel,
                  { fontSize: responsiveFontSize(14) + fontOffset },
                ]}
              >
                현재 선택: {currentLabel}
              </Text>
              <Text
                style={[
                  styles.currentDesc,
                  { fontSize: responsiveFontSize(12) + fontOffset },
                ]}
              >
                {descText}
              </Text>
            </View>

            <CustomButton
              type="outline"
              title="닫기"
              onPress={() => setVisible(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "86%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalTitle: {
    fontFamily: "NotoSansKR",
    fontWeight: "700",
    color: "#17171B",
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: "NotoSansKR",
    fontWeight: "700",
    color: "#555555",
    marginBottom: 16,
    lineHeight: 20,
  },
  currentBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    marginTop: 14,
    marginBottom: 10,
  },
  currentLabel: {
    fontFamily: "NotoSansKR",
    fontWeight: "700",
    color: "#17171B",
    marginBottom: 4,
  },
  currentDesc: {
    fontFamily: "NotoSansKR",
    fontWeight: "700",
    color: "#666666",
    lineHeight: 18,
  },
});

export default UserTypeSelectorButton;
