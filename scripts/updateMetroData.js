// /api/updateMetroData.js

const admin = require('firebase-admin');

// ▼▼▼▼▼▼▼▼▼▼ 이 부분을 수정하세요 ▼▼▼▼▼▼▼▼▼▼

// 1. JSON 파일을 직접 불러오는 줄을 삭제합니다.
// const serviceAccount = require('../service-account-key.json');

// 2. 환경 변수에서 키 값을 가져와 JSON으로 변환합니다.
//    (Vercel 서버에서만 process.env.FIREBASE_SERVICE_ACCOUNT 값을 읽을 수 있습니다.)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// ▲▲▲▲▲▲▲▲▲▲ 여기까지 수정 ▲▲▲▲▲▲▲▲▲▲

// Firebase Admin 앱 초기화 (이 부분은 그대로 둡니다)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// ... 이하 코드는 모두 동일 ...