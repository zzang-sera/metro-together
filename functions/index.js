const functions = require("firebase-functions");
const axios = require("axios");
const xml2js = require("xml2js");


const API_KEY = functions.config().seoul.api_key;

exports.getStationInfo = functions.https.onCall(async (data, context) => {
  const stationName = data.stationName;
  if (!stationName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "stationName이 필요합니다."
    );
  }

  const API_URL = `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/SearchInfoBySubwayNameService/1/5/${encodeURIComponent(stationName)}`;

  try {
    console.log(`API 호출: ${stationName}`);
    const response = await axios.get(API_URL);

    const parser = new xml2js.Parser({ explicitArray: false });
    const jsonData = await parser.parseStringPromise(response.data);

    const rows = jsonData.SearchInfoBySubwayNameService.row;
    if (!rows) {
      console.log("API에서 해당 역 정보를 찾을 수 없음");
      return []; 
    }

    const stations = Array.isArray(rows) ? rows : [rows];
    console.log(`데이터 ${stations.length}건 반환`);
    return stations;
    
  } catch (error) {
    console.error("API 데이터 처리 실패:", error);
    throw new functions.https.HttpsError(
      "unknown",
      "데이터를 가져오는 데 실패했습니다."
    );
  }
});