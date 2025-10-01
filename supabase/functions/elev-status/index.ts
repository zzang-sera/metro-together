// Deno Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  // 조회만이면 ANON도 가능하지만, 안전하게 SERVICE_ROLE 권장
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ──────────────────────────────────────────────────────────────
// 환경변수로 테이블명 주입 가능하게 (없으면 하드코딩된 기본값 사용)
const TABLE = Deno.env.get("ELEV_TABLE") || "public.metro_elevators";

// 공용 JSON 응답 유틸
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code")?.trim() || null;
    const name = url.searchParams.get("name")?.trim() || null;

    if (!code && !name) {
      return json({ ok: false, error: "code 또는 name 을 전달하세요" }, 400);
    }

    // 실제 컬럼명에 맞춰 별칭(alias)로 프론트 표준 키로 변환
    let query = supabase
      .from(TABLE)
      .select(`
        code:station_cd,
        name:station_nm,
        facilityName:elvtr_nm,
        section:opr_sec,
        location:instl_pstn,
        status:use_yn,
        kind:elvtr_se,
        line,
        updated_at
      `);

    if (code) {
      // 문자열 그대로 비교 (선행 0 보존)
      query = query.eq("station_cd", code);
    } else if (name) {
      // 역명 부분/대소문자 무시 검색
      query = query.ilike("station_nm", `%${name}%`);
    }

    const { data, error } = await query.limit(200);
    if (error) return json({ ok: false, error: error.message }, 500);

    // 상태값 보정
    const rows = (data || []).map((r: any) => ({
      ...r,
      status:
        r.status === "Y" ? "사용가능" :
        r.status === "N" ? "중지" :
        r.status ?? "-",
    }));

    return json({ ok: true, rows });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, 500);
  }
});
