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
      // ✨ 1. '삭제' 버튼 타입을 추가합니다.
      case 'destructive':
        return [styles.buttonBase, styles.destructiveButton];
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
      // ✨ 2. '삭제' 버튼의 텍스트 스타일을 추가합니다.
      case 'destructive':
        return [styles.textBase, styles.destructiveButtonText];
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
  buttonBase: {
    width: widthPercentage(300),
    height: widthPercentage(60),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 40,
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
  featureButton: {
    backgroundColor: '#14CAC9',
  },
  featureButtonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(20),
  },
  outlineButton: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#14CAC9',
  },
  outlineButtonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(20),
  },
  primaryButton: {
    backgroundColor: '#14CAC9',
    width: '100%',
    height: 56,
    borderRadius: 8,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(18),
  },
  // ✨ 3. '삭제' 버튼의 스타일을 정의합니다.
  destructiveButton: {
    backgroundColor: '#D32F2F', // 빨간색 배경
  },
  destructiveButtonText: {
    color: '#FFFFFF', // 흰색 텍스트
    fontSize: responsiveFontSize(20),
  },
});

export default CustomButton;

