import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#17171B',
    fontSize: 22,
  },
});

export default FeatureButton;