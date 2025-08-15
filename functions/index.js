// 필요한 라이브러리를 가져옵니다.
const functions = require("firebase-functions");
const axios = require("axios");
const xml2js = require("xml2js");

// Firebase Admin은 DB에 접근할 때만 필요하므로 이 함수에서는 삭제합니다.
// const admin = require("firebase-admin");

// 환경변수에서 API 키를 가져옵니다.
const API_KEY = functions.config().seoul.api_key;

// ▼ 1. 함수 종류 변경: pubsub.schedule -> https.onCall
//    이제 이 함수는 앱에서 'getStationInfo'라는 이름으로 호출할 수 있습니다.
exports.getStationInfo = functions.https.onCall(async (data, context) => {
  // 앱에서 data 객체에 stationName을 담아 보냅니다. ex) { stationName: '시청' }
  const stationName = data.stationName;
  if (!stationName) {
    // 앱에서 역 이름을 보내지 않은 경우 에러를 반환합니다.
    throw new functions.https.HttpsError(
      "invalid-argument",
      "stationName이 필요합니다."
    );
  }

  // API URL에 앱에서 받은 역 이름을 동적으로 추가합니다.
  const API_URL = `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/SearchInfoBySubwayNameService/1/5/${encodeURIComponent(stationName)}`;

  try {
    // 2. Open API 호출
    console.log(`API 호출: ${stationName}`);
    const response = await axios.get(API_URL);

    // 3. XML -> JSON 변환
    const parser = new xml2js.Parser({ explicitArray: false });
    const jsonData = await parser.parseStringPromise(response.data);

    // 4. 필요한 데이터 추출
    const rows = jsonData.SearchInfoBySubwayNameService.row;
    if (!rows) {
      console.log("API에서 해당 역 정보를 찾을 수 없음");
      return []; // 데이터가 없으면 빈 배열을 반환
    }

    // ▼ 5. DB 저장 로직 전체 삭제!
    //    대신, 추출한 데이터를 앱(클라이언트)으로 바로 반환(return)합니다.
    const stations = Array.isArray(rows) ? rows : [rows];
    console.log(`데이터 ${stations.length}건 반환`);
    return stations;
    
  } catch (error) {
    console.error("API 데이터 처리 실패:", error);
    // 6. 에러가 발생하면 클라이언트에 에러를 던져줍니다.
    throw new functions.https.HttpsError(
      "unknown",
      "데이터를 가져오는 데 실패했습니다."
    );
  }
});