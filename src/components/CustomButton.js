import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { widthPercentage, responsiveFontSize } from '../utils/responsive';

const CustomButton = ({ title, onPress, type = 'feature' }) => {
  const getButtonStyles = () => {
    switch (type) {
      case 'outline':
        return [styles.buttonBase, styles.outlineButton];
      case 'primary':
        return [styles.buttonBase, styles.primaryButton];
      default: // 'feature'
        return [styles.buttonBase, styles.featureButton];
    }
  };

  const getTextStyles = () => {
     switch (type) {
      case 'outline':
        return [styles.textBase, styles.outlineButtonText];
      case 'primary':
        return [styles.textBase, styles.primaryButtonText];
      default: // 'feature'
        return [styles.textBase, styles.featureButtonText];
    }
  };

  return (
    <TouchableOpacity style={getButtonStyles()} onPress={onPress}>
      <Text style={getTextStyles()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // --- 모든 버튼의 공통 기본 스타일 ---
  buttonBase: {
    width: widthPercentage(300),
    height: widthPercentage(60),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 40,
    // ✨ 그림자 효과를 추가했습니다.
    elevation: 2,
    shadowColor: '#1A1E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textBase: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
  },
  // --- Type: 'feature' (가까운 역 안내 등) ---
  featureButton: {
    backgroundColor: '#14CAC9',
  },
  featureButtonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(20),
  },
  // --- Type: 'outline' (이메일로 시작하기 등) ---
  outlineButton: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#14CAC9',
  },
  outlineButtonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(20),
  },
  // --- Type: 'primary' (로그인 등) ---
  primaryButton: {
    backgroundColor: '#14CAC9',
    width: '100%',
    height: 56,
    borderRadius: 40,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(18),
  },
});

export default CustomButton;

