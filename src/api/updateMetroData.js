// /api/updateMetroData.js

// 1. 필요한 도구들을 불러옵니다.
const admin = require('firebase-admin');

// 2. 아까 다운로드한 '마스터키(JSON)' 파일의 경로를 정확하게 적어주세요.
//    파일을 프로젝트 폴더 최상단에 옮겨두면 경로 작성이 쉽습니다.
const serviceAccount = require('../service-account-key.json'); // '..'은 상위 폴더로 이동을 의미합니다.

// 3. Firebase 관리자 앱을 초기화합니다. (이미 초기화되어 있으면 생략)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 4. Vercel이 정해진 시간마다 이 함수를 실행시킵니다.
export default async function handler(req, res) {
  try {
    console.log("지하철 정보 업데이트를 시작합니다.");

    // 5. 공공데이터 API를 호출합니다. (URL의 '인증키'와 '서울'역 부분은 원하는대로 바꾸세요)
    const API_KEY = '여기에_본인의_공공데이터_인증키를_넣으세요';
    const response = await fetch(`http://swopenAPI.seoul.go.kr/api/subway/${API_KEY}/json/realtimeStationArrival/0/5/서울`);
    const apiData = await response.json();

    // 6. Firestore 'metro-info' 컬렉션에 'seoul-station' 라는 이름으로 데이터를 저장합니다.
    const docRef = db.collection('metro-info').doc('seoul-station');
    await docRef.set({
      lastUpdated: new Date(), // 마지막 업데이트 시간 기록
      data: apiData.realtimeArrivalList || [] // 실제 도착 정보 데이터
    });

    console.log('성공! Firestore에 지하철 정보를 업데이트했습니다.');
    res.status(200).send('Successfully updated metro data!');

  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).send('Error updating data.');
  }
}