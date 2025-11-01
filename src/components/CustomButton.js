import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveFontSize } from '../utils/responsive';
import { useFontSize } from '../contexts/FontSizeContext';

const CustomButton = ({ 
  title, 
  onPress, 
  type = 'feature', 
  children, 
  style, 
  ...props
}) => {
  const { fontOffset } = useFontSize();

  // 1. 'call' 타입 추가
  const getButtonStyles = () => {
    switch (type) {
      case 'outline':
        return [styles.buttonBase, styles.outlineButton];
      case 'primary':
        return [styles.buttonBase, styles.primaryButton];
      case 'destructive':
        return [styles.buttonBase, styles.destructiveButton];
      case 'call': // 'call' 타입 추가
        return [styles.buttonBase, styles.callButton];
      default: // 'feature'
        return [styles.buttonBase, styles.featureButton];
    }
  };

  // 2. 'call' 타입 텍스트 스타일 추가 (children 사용 시 직접 적용되진 않음)
  const getTextStyles = () => {
    switch (type) {
      case 'outline':
        return [styles.textBase, styles.outlineButtonText];
      case 'primary':
        return [styles.textBase, styles.primaryButtonText];
      case 'destructive':
        return [styles.textBase, styles.destructiveButtonText];
      case 'call': // 'call' 텍스트 타입 추가
        return [styles.textBase, styles.callButtonText];
      default: // 'feature'
        return [styles.textBase, styles.featureButtonText];
    }
  };
  
  const baseFontSize = (type === 'primary' || type === 'destructive') ? 20 : 20;

  return (
    <TouchableOpacity 
      style={[getButtonStyles(), style]} 
      onPress={onPress}
      {...props} 
    >
      {children ? children : (
        <Text 
          style={[
            getTextStyles(), 
            { fontSize: responsiveFontSize(baseFontSize) + fontOffset }
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    width: '100%', 
    height: responsiveWidth(60),
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12, // 기본 간격 (StationDetailScreen에서 16으로 덮어쓸 예정)
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

  // 3. 'call' 버튼 스타일 정의 (고대비 WCAG 충족 색상)
  callButton: {
    backgroundColor: '#E6FFFA', // 기존 callButton 배경색
    borderWidth: 1.5,
    borderColor: '#0F766E', // 기존 callButton 텍스트/아이콘색
  },
  callButtonText: {
    color: '#17171B', // 기존 callButton 텍스트/아이콘색
  },
});

export default CustomButton;