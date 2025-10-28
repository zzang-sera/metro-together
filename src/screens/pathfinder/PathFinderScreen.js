import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { useFontSize } from '../../contexts/FontSizeContext';
import { responsiveFontSize, responsiveHeight } from '../../utils/responsive';

const SUPABASE_URL = 'https://utqfwkhxacqhgjjalpby.supabase.co/functions/v1/pathfinder';

const PathFinderScreen = () => {
  const navigation = useNavigation();
  const { fontOffset } = useFontSize();

  const [dep, setDep] = useState('');
  const [arr, setArr] = useState('');
  const [wheelchair, setWheelchair] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFindPath = async () => {
    if (!dep.trim() || !arr.trim()) {
      Alert.alert('입력 필요', '출발역과 도착역을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const url = `${SUPABASE_URL}?dep=${encodeURIComponent(dep)}&arr=${encodeURIComponent(arr)}&wheelchair=${wheelchair}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        Alert.alert('오류', data.error);
      } else {
        navigation.navigate('PathResult', { pathData: data, dep, arr });
      }
    } catch (err) {
      Alert.alert('에러', '경로를 불러오는 중 문제가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: responsiveFontSize(22) + fontOffset }]}>
          교통약자용 이동경로 찾기
        </Text>
        <Text style={[styles.subtitle, { fontSize: responsiveFontSize(15) + fontOffset }]}>
          출발역과 도착역을 입력하고, 휠체어 이용 여부를 선택하세요.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="train-outline" size={22 + fontOffset / 2} color="#14CAC9" />
          <TextInput
            style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
            placeholder="출발역 입력"
            value={dep}
            onChangeText={setDep}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="flag-outline" size={22 + fontOffset / 2} color="#14CAC9" />
          <TextInput
            style={[styles.input, { fontSize: responsiveFontSize(18) + fontOffset }]}
            placeholder="도착역 입력"
            value={arr}
            onChangeText={setArr}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.checkboxContainer, wheelchair && styles.checkboxChecked]}
          onPress={() => setWheelchair(!wheelchair)}
        >
          <Ionicons
            name={wheelchair ? 'checkbox-outline' : 'square-outline'}
            size={26 + fontOffset / 2}
            color={wheelchair ? '#14CAC9' : '#999'}
          />
          <Text style={[styles.checkboxText, { fontSize: responsiveFontSize(16) + fontOffset }]}>
            휠체어 이용자입니다
          </Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#14CAC9" style={{ marginTop: 30 }} />
        ) : (
          <CustomButton
            type="feature"
            title="길찾기 시작"
            onPress={handleFindPath}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'NotoSansKR',
    fontWeight: '500',
    color: '#595959',
  },
  form: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
    color: '#17171B',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveHeight(2),
  },
  checkboxChecked: {},
  checkboxText: {
    marginLeft: 8,
    color: '#17171B',
    fontFamily: 'NotoSansKR',
    fontWeight: '700',
  },
});

export default PathFinderScreen;
