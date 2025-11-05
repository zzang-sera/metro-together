//src/screens/policy/PolicyScreen.js
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';
import { useFontSize } from '../../contexts/FontSizeContext';

const PolicyScreen = ({ navigation }) => {
  const { fontOffset } = useFontSize();
  const route = useRoute();
  const { title, content } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.content, { fontSize: responsiveFontSize(14) + fontOffset }]}>
        {content}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: responsiveWidth(16),
  },
  content: {
    fontFamily: 'NotoSansKR',
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    lineHeight: responsiveHeight(24),
    color: '#17171B',
  },
});

export default PolicyScreen;
