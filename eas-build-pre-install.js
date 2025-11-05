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

  fs.writeFileSync(filePath, Buffer.from(googleServices, "base64"));
  console.log("google-services.json created successfully at", filePath);
} else {
  console.warn("GOOGLE_SERVICES_JSON not found in environment variables.");
}
