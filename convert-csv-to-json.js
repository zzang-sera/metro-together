// convert-csv-to-json.js
//변경 코드
//node convert-csv-to-json.js src/assets/metro-data/metro/폴더명/파일명
import path from "path";
import csv from "csvtojson";

const inputFile = process.argv[2]; // 변환할 CSV 경로
if (!inputFile) {
  console.error("⚠️ 변환할 CSV 파일 경로를 인자로 넣어주세요.");
  process.exit(1);
}

const outputFile = inputFile.replace(/\.csv$/i, ".json");

csv()
  .fromFile(inputFile)
  .then((jsonArray) => {
    fs.writeFileSync(outputFile, JSON.stringify(jsonArray, null, 2), "utf-8");
    console.log(`✅ 변환 완료: ${path.basename(outputFile)} (${jsonArray.length} rows)`);
  })
  .catch((err) => {
    console.error("❌ 변환 중 오류:", err);
  });
