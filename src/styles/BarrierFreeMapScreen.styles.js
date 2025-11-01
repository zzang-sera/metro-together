import { StyleSheet, Dimensions } from 'react-native';

const { width: screenW, height: screenH } = Dimensions.get('window');

export const colors = {
  text: '#17171B',
  textSecondary: '#555555',
  textOnPrimary: '#0D0D0D',
  primary: '#14CAC9',
  background: '#F9F9F9',
  white: '#FFFFFF',
  border: '#EEEEEE',
  destructive: '#D32F2F',
  warningBorder: '#FEEB8A',
  warningBackground: '#FFFBEB',
  warningText: '#8A6100',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },

  imageContainer: {
    width: screenW,
    height: screenH * 0.55,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },

  mapWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  backOverlay: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backFab: {
    position: 'absolute',
    top: 20,
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },

  listContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },

  disclaimerBox: {
    marginBottom: 16,
    alignItems: 'center',
  },

  disclaimerText: {
    color: colors.warningText,
    fontWeight: '700',
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#1A1E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },

  cardBorderAvailable: {
    borderColor: colors.primary,
  },
  cardBorderUnavailable: {
    borderColor: colors.destructive,
  },
  cardBorderLocal: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningBackground,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  facilityTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  facilityDesc: {
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '700',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadgeAvailable: {
    backgroundColor: colors.primary,
  },
  statusBadgeUnavailable: {
    backgroundColor: colors.destructive,
  },
  statusBadgeText: {
    fontWeight: '700',
  },
  statusBadgeTextAvailable: {
    color: colors.textOnPrimary,
  },
  statusBadgeTextUnavailable: {
    color: colors.white,
  },

  facilityContact: {
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
    fontWeight: '700',
  },

  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    paddingBottom: 20,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },


  buttonContainer: {
    paddingHorizontal: '5%', 
    marginTop: 14,        
    marginBottom: 20,      
  },
  buttonContentLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 0, 
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconLabel: {
    color: colors.text, 
    fontWeight: 'bold',
  },
});