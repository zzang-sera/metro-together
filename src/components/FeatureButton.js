import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { widthPercentage, responsiveFontSize } from '../utils/responsive';

const FeatureButton = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#14CAC9',
    width: widthPercentage(300),
    height: widthPercentage(60),
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#17171B',
    fontSize: responsiveFontSize(22),
    fontFamily: 'NotoSansKR', // Variable Font 대표 이름
    fontWeight: '500',      // Medium 두께
  },
});

export default FeatureButton;

