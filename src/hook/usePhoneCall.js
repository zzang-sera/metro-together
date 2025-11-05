import { useCallback } from "react";
import { Linking, Alert } from "react-native";

/**
 * @param {string} defaultNumber 
 */
export function usePhoneCall(defaultNumber) {
  const makeCall = useCallback(async (number) => {
    const phoneNumber = number || defaultNumber;
    if (!phoneNumber) {
      Alert.alert("전화번호가 없습니다.");
      return;
    }

    const url = `tel:${phoneNumber}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("전화 앱을 열 수 없습니다.");
    }
  }, [defaultNumber]);

  return { makeCall };
}
