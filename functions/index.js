const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const xml2js = require("xml2js");

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// 환경변수로 API Key 설정 (Firebase CLI에서: firebase functions:config:set seoul.api_key="YOUR_API_KEY")
const API_KEY = functions.config().seoul.api_key;

// Open API URL
const API_URL = `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/SearchInfoBySubwayNameService/1/1000/강남`;

// 24시간마다 실행되는 Cloud Function
exports.updateStations = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    try {
      // 1. Open API 호출
      const response = await axios.get(API_URL);

      // 2. XML → JSON 변환
      const parser = new xml2js.Parser({ explicitArray: false });
      const jsonData = await parser.parseStringPromise(response.data);

      // 3. 필요한 데이터 추출
      const rows = jsonData.SearchInfoBySubwayNameService.row;
      if (!rows) {
        console.log("API 데이터 없음");
        return null;
      }

      // 4. Firestore에 저장
      const stations = Array.isArray(rows) ? rows : [rows];
      for (const station of stations) {
        const stationId = station.STATION_CD || station.STATION_ID || "unknown";
        await db.collection("stations").doc(stationId).set({
          name: station.STATION_NM,
          line: station.LINE_NUM,
          code: stationId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log("지하철역 데이터 업데이트 완료");
      return null;
    } catch (error) {
      console.error("데이터 업데이트 실패:", error);
      return null;
    }
  });
