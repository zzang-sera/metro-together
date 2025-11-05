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

  callButton: {
    backgroundColor: '#E6FFFA', 
    borderWidth: 1.5,
    borderColor: '#0F766E', 
  },
  callButtonText: {
    color: '#17171B', 
  },
});

export default CustomButton;