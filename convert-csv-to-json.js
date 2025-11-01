// convert-csv-to-json.js
// node convert-csv-to-json.js src/assets/metro-data/metro/폴더명/파일명.csv

import fs from "fs";
import path from "path";

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("⚠️ 변환할 CSV 파일 경로를 인자로 넣어주세요.");
  process.exit(1);
}

const outputFile = inputFile.replace(/\.csv$/i, ".json");

// CSV 읽기
const csvData = fs.readFileSync(inputFile, "utf-8");

// 줄 단위로 나누기
const lines = csvData.trim().split("\n");

// 첫 줄은 헤더
const headers = lines[0].split(",").map((h) => h.trim());

// 각 줄을 객체로 변환
const jsonArray = lines.slice(1).map((line) => {
  const values = line.split(",");
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = values[i] ? values[i].trim() : "";
  });
  return obj;
});

// JSON 파일로 저장
fs.writeFileSync(outputFile, JSON.stringify(jsonArray, null, 2), "utf-8");

console.log(`✅ 변환 완료: ${path.basename(outputFile)} (${jsonArray.length} rows)`);
