//src/styles/mainStyles.js
import { StyleSheet } from 'react-native';
import { widthPercentage, responsiveFontSize } from '../utils/responsive';

export const mainStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        justifyContent: 'space-between',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    greetingText: {
        fontSize: responsiveFontSize(24),
        fontFamily: 'NotoSansKR',
        fontWeight: '700',
        color: '#17171B',
        lineHeight: responsiveFontSize(34),
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    }
});
