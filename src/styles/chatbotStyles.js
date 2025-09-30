import { StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../utils/responsive';

export const chatbotStyles = StyleSheet.create({
  // --- 전체 레이아웃 ---
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  chatListContent: {
    paddingVertical: responsiveHeight(16),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- 메시지 종류별 스타일 ---
  messageRow: {
    flexDirection: 'row',
    marginVertical: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(16), 
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: responsiveWidth(8),
    alignItems: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
  },
  botName: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFontSize(12),
    fontWeight: '700',
    color: '#17171B',
    fontFamily: 'NotoSansKR',
  },
  botBubbleContainer: {
    flex: 1,
  },
  bubble: {
    paddingHorizontal: responsiveWidth(14),
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(18),
  },
  botBubble: {
    backgroundColor: '#E2E6EA',
    borderTopLeftRadius: 0,
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#14CAC9',
    borderTopRightRadius: 0,
    maxWidth: '90%', 
  },
  messageText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveHeight(22),
  },
  botText: {
    color: '#17171B',
    fontWeight: '700',
  },
  userText: {
    color: '#17171B',
    fontWeight: '700',
  },
  
  // --- 시스템 메시지 (연결) ---
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(10),
  },
  systemBubble: {
    backgroundColor: '#E2E6EA',
    borderRadius: responsiveWidth(20),
    paddingVertical: responsiveHeight(6),
    paddingHorizontal: responsiveWidth(12),
  },
  systemText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(12),
    color: '#17171B',
    fontWeight: '700',
  },

  // --- 지도 Placeholder ---
  mapPlaceholder: {
    width: responsiveWidth(240), 
    height: responsiveWidth(180),
    backgroundColor: '#E2E6EA',
    borderRadius: responsiveWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveFontSize(24),
    color: '#17171B',
  },

  // --- 빠른 응답 버튼 ---
  quickReplyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: responsiveWidth(16),
    paddingBottom: responsiveHeight(8),
  },
  quickReplyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EA',
    borderRadius: responsiveWidth(20),
    paddingVertical: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(14),
    marginRight: responsiveWidth(8),
    marginBottom: responsiveHeight(8),
  },
  quickReplyText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(14),
    color: '#17171B',
    fontWeight: '700',
  },
  
  // --- 하단 입력창 ---
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(8),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E6EA',
  },
  input: {
    flex: 1,
    height: responsiveHeight(42),
    backgroundColor: '#F0F2F5',
    borderRadius: responsiveWidth(21),
    paddingHorizontal: responsiveWidth(16),
    fontSize: responsiveFontSize(15),
    fontFamily: 'NotoSansKR',
    color: '#17171B',
    fontWeight: '700',
  },
  sendButton: {
    marginLeft: responsiveWidth(8),
    padding: responsiveWidth(8),
  },
});