// src/api/seoulElev.js
const BASE = "http://openapi.seoul.go.kr:8088";

// ✅ OA-15994 데이터셋의 OpenAPI '서비스명(SERVICE)'을 정확히 복사해 넣으세요.
//   (로그인 후 데이터셋 페이지의 OpenAPI 탭에서 SERVICE 문자열 확인)
//   예시) "SeoulMetroElevatorStatus" 같은 형식 — 실제 값으로 바꾸세요!
const SVC = "<<<OA15994_SERVICE_NAME_HERE>>>";

function makeUrl({ key, start = 1, end = 20, param }) {
  const segs = [key, "json", SVC, String(start), String(end)];
  if (param !== undefined && param !== null && param !== "") segs.push(param);
  return `${BASE}/${segs.join("/")}`;
}

// 간단 재시도(네트워크/일시 오류 대비)
async function getJson(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

// 입력이 숫자면 역코드(0150/150 둘 다 시도), 아니면 역명(한글 인코딩)
export async function getElevStatus(key, input, { start = 1, end = 50 } = {}) {
  const isDigit = /^[0-9]+$/.test(String(input).trim());
  const candidates = isDigit
    ? [String(input).trim(), String(input).trim().replace(/^0+/, "")]
    : [encodeURIComponent(String(input).trim())];

  for (const p of candidates) {
    const url = makeUrl({ key, start, end, param: p });
    const json = await getJson(url);

    // 오류 코드면 다음 후보 시도
    if (json?.RESULT?.CODE?.startsWith?.("ERROR-")) continue;

    // 최상단에서 row 배열을 찾아서 꺼내기(서비스명 키가 다를 수 있어 방어적으로 탐색)
    const top =
      json?.[SVC] ||
      Object.values(json).find(
        v => v && typeof v === "object" && ("row" in v || "ROW" in v)
      );

    const rows = top?.row ?? top?.ROW ?? [];
    const total = top?.list_total_count ?? null;

    if (Array.isArray(rows)) {
      return { ok: true, rows, meta: { total, usedParam: p } };
    }
  }
  return { ok: false, error: "NO_DATA_OR_SERVER" };
}
