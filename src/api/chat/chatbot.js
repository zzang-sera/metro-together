import { detectIntent, extractStation, INTENTS } from "../../utils/intent";

async function getArrivalsFromAPI(station) {
  return [
    { line: "2호선", updn: "내선", arrMsg: "2분 후 도착" },
    { line: "2호선", updn: "외선", arrMsg: "5분 후 도착" },
  ];
}

export async function chatReply(userText) {
  const intent = detectIntent(userText);
  const station = extractStation(userText);

  if (intent === INTENTS.ACCESS_ELEVATOR) {
    if (!station) {
      return { text: "어느 역을 도와드릴까요? 예) '서울역 엘리베이터 위치'", quick: ["서울역", "강남역", "시청역"] };
    }
    return { text: `${station}역 엘리베이터는 개찰구 중앙 쪽에 있습니다. (상세 데이터 연결 예정)` };
  }

  if (intent === INTENTS.NEAR_DOOR) {
    if (!station) return { text: "하차할 역을 알려 주세요. 예) '강남역 몇 번째 칸?'" };
    return { text: `${station}역은 4칸 2번 문이 엘리베이터와 가깝습니다. (임시 응답)` };
  }

  if (intent === INTENTS.ARRIVAL_STATUS) {
    if (!station) return { text: "어느 역 도착 정보를 볼까요? 예) '서울역 실시간'" };
    const items = await getArrivalsFromAPI(station);
    const body = items.slice(0, 3).map(x => `${x.line} ${x.updn} ${x.arrMsg}`).join(" / ");
    return { text: `[임시] ${station}역 도착 정보: ${body}` };
  }

  return {
    text: "예) '서울역 엘리베이터', '강남역 몇 번째 칸', '서울역 실시간' 처럼 물어보세요.",
    quick: ["서울역 엘리베이터", "강남역 몇 번째 칸", "서울역 실시간"],
  };
}