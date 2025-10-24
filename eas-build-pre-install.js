// eas-build-pre-install.js
const fs = require("fs");
const path = require("path");

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const googleServices = process.env.GOOGLE_SERVICES_JSON;

if (googleServices) {
  const appDir = path.join(process.cwd(), "android", "app");
  ensureDirExists(appDir);
  const filePath = path.join(appDir, "google-services.json");

  // 환경 변수에 담긴 base64 문자열을 JSON 파일로 변환
  fs.writeFileSync(filePath, Buffer.from(googleServices, "base64"));
  console.log("✅ google-services.json created successfully at", filePath);
} else {
  console.warn("⚠️ GOOGLE_SERVICES_JSON not found in environment variables.");
}
