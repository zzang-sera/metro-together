// src/components/FontSettingModal.js

import React from 'react';
import { View, Text, Modal, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useFontSize } from '../contexts/FontSizeContext';
import { responsiveFontSize } from '../utils/responsive';

const FontSettingModal = ({ visible, onClose }) => {
  // 전역 Context에서 필요한 값과 함수를 가져옵니다.
  const { fontOffset, setFontOffset } = useFontSize();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalBackdrop} 
        activeOpacity={1} 
        onPressOut={onClose} // 바깥 영역 클릭 시 닫기
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          <Text style={[styles.modalTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
            글자 크기 설정
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="작게" onPress={() => setFontOffset(-2)} />
            <Button title="보통" onPress={() => setFontOffset(0)} />
            <Button title="크게" onPress={() => setFontOffset(4)} />
          </View>
          <Button title="닫기" onPress={onClose} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
});

export default FontSettingModal;