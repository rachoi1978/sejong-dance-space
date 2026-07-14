export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { getVerifiedEmail, } from "../../../../lib/supabaseAuth";
import { isMaster } from "../../../../lib/adminAuth";

export async function POST(req: Request) {
  try {
    // 반드시 구글 로그인 상태여야 하며, 이메일은 서버가 검증한 값만 사용
    const v = await getVerifiedEmail();
    if (!v) {
      return NextResponse.json({ error: "구글 로그인이 필요합니다." }, { status: 401 });
    }
    if (isMaster(v.email)) {
      return NextResponse.json({ error: "이미 마스터 관리자입니다." }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || v.name || "").trim() || v.email;

    const sb = getSupabase();
    const { data: existing } = await sb
      .from("sds_admins")
      .select("id,status")
      .eq("email", v.email)
      .maybeSingle();

    if (existing) {
      const st = (existing as any).status;
      if (st === "approved") return NextResponse.json({ error: "이미 승인된 관리자입니다." }, { status: 409 });
      if (st === "pending") return NextResponse.json({ error: "이미 승인 대기 중입니다." }, { status: 409 });
      const { error } = await sb
        .from("sds_admins")
        .update({ name, status: "pending", approved_by: null, approved_at: null })
        .eq("id", (existing as any).id);
      if (error) throw error;
      return NextResponse.json({ ok: true, status: "pending" });
    }

    const { error } = await sb.from("sds_admins").insert({
      email: v.email,
      name,
      role: "admin",
      status: "pending",
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
