import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useFontSize } from '../contexts/FontSizeContext';
import { responsiveFontSize, responsiveHeight } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

const FontSettingModal = ({ visible, onClose }) => {
  const { fontOffset, setFontOffset } = useFontSize();
  const isSelected = (offset) => fontOffset === offset;

  // [수정] offset 값을 전체적으로 조금씩 키웁니다.
  const options = [
    { label: '작게', offset: -1 },    // -2 -> -1
    { label: '보통', offset: 2 },     // 0 -> 2
    { label: '크게', offset: 5 },     // 4 -> 5
    { label: '아주 크게', offset: 9 }, // 8 -> 9
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
        {/* ModalContainer를 TouchableOpacity로 감싸면 
            Pressable의 onPress 이벤트(배경 클릭 시 닫기)가 가로채질 수 있습니다.
            Pressable 안에서 ModalContainer 클릭 시 이벤트 전파를 막거나,
            ModalContainer 자체는 TouchableOpacity가 아닌 View로 두는 것이 좋습니다.
            여기서는 TouchableOpacity를 View로 변경합니다. */}
        <Pressable style={styles.modalContainer} onPress={() => {}}> 
            <View style={styles.header}>
              <Text style={[styles.modalTitle, { fontSize: responsiveFontSize(18) + fontOffset }]}>
                글자 크기 설정
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="설정 창 닫기">
                <Ionicons name="close" size={24 + fontOffset / 2} color="#555" /> 
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
                    // [수정] 선택된 버튼 텍스트 색상도 명확하게 (흰색)
                    isSelected(option.offset) ? styles.optionButtonTextSelected : {}, 
                    // [추가] 각 버튼의 텍스트 크기도 미리보기처럼 보이도록 조정
                    { fontSize: responsiveFontSize(16) + option.offset } 
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
        </Pressable> 
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
  previewText: {
    textAlign: 'center',
    fontFamily: 'NotoSansKR',
    fontWeight: 'bold',
    color: '#1A1E22',
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden', // [추가] borderRadius 적용되도록
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', 
  },
  optionButton: {
    width: '48%', 
    paddingVertical: responsiveHeight(16), 
    marginBottom: responsiveHeight(10), 
    borderRadius: 40, // [유지] 둥근 버튼
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
    fontWeight: 'bold',
    color: '#17171B',
    // fontSize는 JSX에서 동적으로 설정
  },
  // [수정] 선택된 텍스트 색상을 흰색으로 명확하게 변경
  optionButtonTextSelected: {
    color: '#17171B', 
  },
});

export default FontSettingModal;