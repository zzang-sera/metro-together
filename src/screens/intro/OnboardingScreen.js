import React from "react";
import { Image, Dimensions, View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { useNavigation } from "@react-navigation/native"; 


const { width: W, height: H } = Dimensions.get("window");
const IMG_W = Math.min(320, W * 0.82);
const IMG_H = Math.min(IMG_W * 1.95, H * 0.62);
const MINT = "#14CAC9";

const titleStyle = { fontFamily: "NotoSansKR", fontWeight: "700", color: "#17171B",   marginTop: -50};
const subStyle = { fontFamily: "NotoSansKR", fontWeight: "700", color: "#17171B", lineHeight: 22 };

const Dot = ({ selected }) => (
  <View
    style={{
      width: selected ? 20 : 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
      backgroundColor: selected ? MINT : "#D7EDEA",
    }}
  />
);

const TextBtn = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
    <Text style={{ fontFamily: "NotoSansKR", fontWeight: "700", color: MINT, fontSize: 16 }}>{label}</Text>
  </TouchableOpacity>
);

export default function OnboardingScreen({ onFinish }) {
  const navigation = useNavigation(); 

  const handleFinish = () => {
      if (onFinish) onFinish(); 
      else navigation.goBack();
    };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    <Onboarding
      onDone={handleFinish}
      onSkip={handleFinish}
      titleStyles={titleStyle}
      subTitleStyles={subStyle}
      containerStyles={{ 
        paddingHorizontal: 20,
        paddingTop: 5,     
        paddingBottom: 20,   
       }}
      bottomBarColor="#FFFFFF"
      showDone
      showNext
      showSkip
      NextButtonComponent={(props) => <TextBtn label="다음" {...props} />}
      SkipButtonComponent={(props) => <TextBtn label="건너뛰기" {...props} />}
      DoneButtonComponent={(props) => <TextBtn label="시작하기" {...props} />}
      DotComponent={Dot}
      pages={[
        {
          backgroundColor: "#FFFFFF",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding1.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="시작하기 화면 예시"
            />
          ),
          title: "시작하기",
          subtitle:
            "이메일로 시작하거나 구글 계정으로 가입할 수 있습니다.\n회원가입하면 즐겨찾기와 챗봇 기능을 사용할 수 있어요.\n가입하지 않아도 대부분 기능은 이용 가능합니다.",
        },
        {
          backgroundColor: "#F2FFFD",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding2.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="개인설정 화면 예시"
            />
          ),
          title: "개인설정",
          subtitle:
            "글자 크기를 조절하거나 즐겨찾기한 역을 한눈에 볼 수 있어요.\n나에게 맞는 편의 설정으로 앱을 더욱 쉽게 사용하세요.",
        },
        {
          backgroundColor: "#E8FBF9",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding3.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="가까운 역 안내 화면 예시"
            />
          ),
          title: "가까운 역 안내",
          subtitle:
            "현재 위치 기준으로 가장 가까운 역을 자동으로 찾아줍니다.\n엘리베이터, 에스컬레이터 등 편의시설 현황도 함께 확인할 수 있어요.",
        },
        {
          backgroundColor: "#F2FFFD",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding4.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 검색 화면 예시"
            />
          ),
          title: "원하는 역 검색",
          subtitle:
            "검색창에 역 이름을 입력하면 관련된 역 목록이 표시됩니다.\n역을 선택하면 상세 정보와 길찾기 옵션을 볼 수 있어요.",
        },
        {
          backgroundColor: "#E8FBF9",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding5.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 선택 메뉴 예시"
            />
          ),
          title: "지하철 최단 경로",
          subtitle:
            "출발역과 도착역을 설정하면 최단 거리의 배리어프리 경로를 안내해줍니다.\n엘리베이터나 리프트 위치도 함께 표시됩니다.",
        },
        {
          backgroundColor: "#F2FFFD",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding6.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 선택 시 메뉴 예시"
            />
          ),
          title: "역 선택 시 메뉴",
          subtitle:
            "가까운 역이나 검색한 역을 누르면 다음 메뉴가 뜹니다:\n① 역 정보 보기\n② 출발역으로 길찾기\n③ 도착역으로 길찾기",
        },
        {
          backgroundColor: "#E8FBF9",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding7.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="역 정보 보기 화면 예시"
            />
          ),
          title: "역 정보 보기",
          subtitle:
            "엘리베이터, 화장실, 수유실, 리프트 등의 위치를 확인할 수 있습니다.\n마음에 드는 역은 즐겨찾기에 추가할 수도 있어요.",
        },
        {
          backgroundColor: "#F2FFFD",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding8.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="출발역으로 길찾기 화면 예시"
            />
          ),
          title: "출발역으로 길찾기",
          subtitle:
            "선택한 역을 출발역으로 지정하면 목적지를 선택할 수 있습니다.\n이후 배리어프리 경로를 계산하여 안내해줍니다.",
        },
        {
          backgroundColor: "#E8FBF9",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding9.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="도착역으로 길찾기 화면 예시"
            />
          ),
          title: "도착역으로 길찾기",
          subtitle:
            "출발역을 이미 지정한 상태에서 도착역을 선택하면,\n두 역 사이의 이동 경로가 표시됩니다.",
        },
        {
          backgroundColor: "#F2FFFD",
          image: (
            <Image
              source={require("../../assets/onboarding/onboarding10_chatbot.jpg")}
              style={{ width: IMG_W, height: IMG_H, borderRadius: 20 }}
              resizeMode="contain"
              accessible
              accessibilityLabel="챗봇 화면 예시"
            />
          ),
          title: "지하철 챗봇 서비스",
          subtitle:
            "역 시설 정보, 화장실 위치, 승강기 상태 등 궁금한 점을 챗봇에게 물어보세요.\n실시간으로 정보를 받아 대화하듯 쉽게 확인할 수 있습니다.",
        },
      ]}
    />
    </SafeAreaView>

  );
}

