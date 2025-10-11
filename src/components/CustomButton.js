// src/components/CustomButton.js (전체 수정 코드)

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveFontSize } from '../utils/responsive';

// 1. 우리가 만든 useFontSize 훅을 불러옵니다.
import { useFontSize } from '../contexts/FontSizeContext';

const CustomButton = ({ title, onPress, type = 'feature' }) => {
  // 2. Context에서 fontOffset 값을 가져옵니다.
  const { fontOffset } = useFontSize();

  const getButtonStyles = () => {
    switch (type) {
      case 'outline':
        return [styles.buttonBase, styles.outlineButton];
      case 'primary':
        return [styles.buttonBase, styles.primaryButton];
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
      case 'destructive':
        return [styles.textBase, styles.destructiveButtonText];
      default: // 'feature'
        return [styles.textBase, styles.featureButtonText];
    }
  };
  
  // 3. 버튼 타입별로 기본 폰트 크기를 정합니다. (기존 StyleSheet 참고)
  const baseFontSize = type === 'primary' ? 18 : 20;

  return (
    <TouchableOpacity style={getButtonStyles()} onPress={onPress}>
      {/* 4. 최종적으로 Text의 style에 fontOffset을 더한 값을 적용합니다. */}
      <Text 
        style={[
          getTextStyles(), 
          { fontSize: responsiveFontSize(baseFontSize) + fontOffset }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    width: responsiveWidth(300),
    height: responsiveWidth(60),
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
  },
  outlineButton: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#14CAC9',
  },
  outlineButtonText: {
    color: '#17171B',
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
  },
  destructiveButton: {
    backgroundColor: '#D32F2F',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

export default CustomButton;