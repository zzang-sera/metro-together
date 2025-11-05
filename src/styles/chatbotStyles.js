import { StyleSheet, Platform } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../utils/responsive';

export const createChatbotStyles = (fontOffset = 0) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  chatListContent: {
    paddingVertical: responsiveHeight(16),
    paddingBottom: responsiveHeight(80) + fontOffset * 2, 
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

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
    alignItems: 'flex-end', 
  },
  avatarContainer: {
    marginRight: responsiveWidth(8),
    alignItems: 'center',
    flexShrink: 0,
  },
  avatar: {
  },
  botName: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFontSize(12) + fontOffset, 
    fontWeight: '700',
    color: '#17171B',
    fontFamily: 'NotoSansKR',
  },
  botBubbleContainer: {
    flex: 1, 
  },
  bubble: {
    paddingHorizontal: responsiveWidth(14) + fontOffset / 2, 
    paddingVertical: responsiveHeight(10) + fontOffset / 3, 
    borderRadius: responsiveWidth(18),
    maxWidth: '95%',
  },
  botBubble: {
    backgroundColor: '#E2E6EA',
    borderBottomLeftRadius: 0, 
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#14CAC9',
    borderBottomRightRadius: 0, 
    alignSelf: 'flex-end',
  },
  messageText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(15) + fontOffset, 
    lineHeight: responsiveHeight(22) + fontOffset * 1.4, 
  },
  botText: {
    color: '#17171B',
    fontWeight: '700',
  },
  userText: {
    color: '#17171B', 
    fontWeight: '700',
  },

  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(10),
  },
  systemBubble: {
    backgroundColor: '#E2E6EA',
    borderRadius: responsiveWidth(20),
    paddingVertical: responsiveHeight(6) + fontOffset / 4, 
    paddingHorizontal: responsiveWidth(12) + fontOffset / 2, 
  },
  systemText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(12) + fontOffset, 
    color: '#17171B', 
    fontWeight: '700',
  },

  menuButtonContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(10),
  },
  menuButtonSpacer: {
    width: responsiveWidth(40) + fontOffset * 1.5,
    marginRight: responsiveWidth(8), 
  },
  menuButton: {
    flex: 1, 
    backgroundColor: "#14CAC9",
    borderRadius: responsiveWidth(20) + fontOffset, 
    paddingVertical: responsiveHeight(10) + fontOffset * 0.5, 
    paddingHorizontal: responsiveWidth(20) + fontOffset, 
    alignItems: 'center', 
  },
  menuButtonText: {
    color: "#17171B", 
    fontWeight: "700",
    fontFamily: "NotoSansKR",
    fontSize: responsiveFontSize(14) + fontOffset, 
  },

  menuRow: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
  },
  menuSpacer: {
    width: responsiveWidth(40) + fontOffset * 1.5,
    marginRight: responsiveWidth(8),
  },
  menuContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(18) + fontOffset, 
    padding: responsiveWidth(10) + fontOffset * 0.5, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.4,
  },
  menuGroup: {
    marginBottom: responsiveWidth(12),
    overflow: 'hidden', 
    borderRadius: responsiveWidth(14) + fontOffset * 0.5,
  },
  menuHeader: {
    borderTopLeftRadius: responsiveWidth(14) + fontOffset * 0.5, 
    borderTopRightRadius: responsiveWidth(14) + fontOffset * 0.5, 
    padding: responsiveWidth(12) + fontOffset * 0.5, 
  },
  menuHeaderText: {
    color: "#17171B", 
    fontWeight: "800",
    fontFamily: "NotoSansKR",
    fontSize: responsiveFontSize(16) + fontOffset, 
  },
  menuItem: {
    padding: responsiveWidth(14) + fontOffset * 0.5, 
    borderTopWidth: 3, 
    borderColor: "#4C5054", 
    backgroundColor: '#FFFFFF', 
  },
  menuItemFirst: {
    borderTopWidth: 0,
  },
  menuItemText: {
    fontWeight: "700",
    color: "#17171B",
    fontFamily: "NotoSansKR",
    fontSize: responsiveFontSize(15) + fontOffset, 
  },


  mapPlaceholder: {
    width: responsiveWidth(240),
    height: responsiveWidth(180),
    backgroundColor: '#D1D5DB',
    borderRadius: responsiveWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    fontSize: responsiveFontSize(24) + fontOffset, 
    color: '#17171B',
  },

  quickReplyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: responsiveWidth(16),
    paddingBottom: responsiveHeight(8),
    justifyContent: 'flex-start',
  },
  quickReplyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#14CAC9',
    borderRadius: responsiveWidth(20),
    paddingVertical: responsiveHeight(8) + fontOffset / 3, 
    paddingHorizontal: responsiveWidth(14) + fontOffset / 2, 
    marginRight: responsiveWidth(8),
    marginBottom: responsiveHeight(8),
  },
  quickReplyText: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(14) + fontOffset, 
    color: '#17171B',
    fontWeight: '700',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(8) + fontOffset / 3, 
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E6EA',
  },
  input: {
    flex: 1,
    minHeight: responsiveHeight(42) + fontOffset, 
    maxHeight: responsiveHeight(100) + fontOffset * 2, 
    backgroundColor: '#F0F2F5',
    borderRadius: responsiveWidth(21),
    paddingHorizontal: responsiveWidth(16),
    paddingTop: Platform.OS === 'ios' ? responsiveHeight(10) + fontOffset / 3 : responsiveHeight(8) + fontOffset / 3, 
    paddingBottom: Platform.OS === 'ios' ? responsiveHeight(10) + fontOffset / 3 : responsiveHeight(8) + fontOffset / 3, 
    fontSize: responsiveFontSize(15) + fontOffset, 
    fontFamily: 'NotoSansKR',
    color: '#17171B',
    fontWeight: '700',
    lineHeight: responsiveHeight(20) + fontOffset * 1.3, 
  },
  sendButton: {
    marginLeft: responsiveWidth(8),
    padding: responsiveWidth(8),
    alignSelf: 'flex-end', 
    paddingBottom: responsiveHeight(10) + fontOffset / 3, 
  },

});