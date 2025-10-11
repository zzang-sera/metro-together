import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useFontSize } from '../contexts/FontSizeContext';
import { responsiveFontSize, responsiveHeight } from '../utils/responsive'; // responsiveHeight 추가
import { Ionicons } from '@expo/vector-icons';

const FontSettingModal = ({ visible, onClose }) => {
  const { fontOffset, setFontOffset } = useFontSize();
  const isSelected = (offset) => fontOffset === offset;

  const options = [
    { label: '작게', offset: -2 },
    { label: '보통', offset: 0 },
    { label: '크게', offset: 4 },
    { label: '아주 크게', offset: 8 },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalBackdrop} 
        onPress={onClose} 
        accessibilityLabel="닫기"
        accessibilityRole="button"
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
            <View style={styles.header}>
                <Text style={[styles.modalTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
                    글자 크기 설정
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="설정 창 닫기">
                    <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            <Text style={[styles.previewText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
                이 크기로 글자가 보입니다.
            </Text>

            <View style={styles.optionsContainer}>
                {options.map((option) => (
                <TouchableOpacity
                    key={option.label}
                    style={[
                        styles.optionButton,
                        isSelected(option.offset) && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFontOffset(option.offset)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`글자 크기를 ${option.label}으로 설정`}
                    accessibilityState={{ selected: isSelected(option.offset) }}
                >
                    <Text style={[
                        styles.optionButtonText,
                        isSelected(option.offset) && styles.optionButtonTextSelected,
                    ]}>
                    {option.label}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontFamily: 'NotoSansKR',
    color: '#17171B',
  },
  closeButton: {
    padding: 4,
  },
  // --- 👇 멋쟁이님께서 수정한 스타일 반영 ---
  previewText: {
    textAlign: 'center',
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#1A1E22',
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 24,
  },
  // --- 👇 2x2 그리드 레이아웃으로 다시 수정 ---
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', 
  },
  optionButton: {
    width: '48%', 
    paddingVertical: responsiveHeight(16), 
    marginBottom: responsiveHeight(10), 
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#14CAC9',
    borderColor: '#14CAC9',
  },
  optionButtonText: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveFontSize(18),
    color: '#17171B',
  },
  optionButtonTextSelected: {
    color: '#17171B',
  },
});

export default FontSettingModal;

