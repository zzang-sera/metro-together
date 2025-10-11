import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveFontSize } from '../utils/responsive';
import { useFontSize } from '../contexts/FontSizeContext';

const CustomButton = ({ title, onPress, type = 'feature' }) => {
  const { fontOffset } = useFontSize();

  // 모든 버튼이 기본 스타일(buttonBase)을 공유하고, 타입별 스타일을 덧입힙니다.
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
  
  const baseFontSize = (type === 'primary' || type === 'destructive') ? 20 : 20;

  return (
    <TouchableOpacity style={getButtonStyles()} onPress={onPress}>
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
  // --- ✨ [수정] 모든 버튼의 기본 모양을 둥근 타원형으로 통일 ---
  buttonBase: {
    width: '100%', // ✨ [수정] 모든 버튼이 부모 컨테이너의 전체 너비를 차지하도록 변경
    height: responsiveWidth(60),
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'center', // width가 100%이므로 더 이상 필요하지 않습니다.
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
    fontWeight: 'bold',
  },
  
  // --- 타입별 색상 및 추가 스타일 ---
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
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#17171B',
  },
  destructiveButton: {
    backgroundColor: '#D32F2F',
  },
  destructiveButtonText: {
    color: '#17171B', 
  },
});

export default CustomButton;

