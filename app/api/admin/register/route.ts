export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { isMaster } from "../../../../lib/adminAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();

    if (!email || !name) {
      return NextResponse.json({ error: "이름과 이메일을 모두 입력하세요." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "올바른 이메일 형식이 아닙니다." }, { status: 400 });
    }
    if (isMaster(email)) {
      return NextResponse.json({ error: "이미 마스터 관리자입니다. 바로 로그인하세요." }, { status: 409 });
    }

    const sb = getSupabase();
    const { data: existing } = await sb
      .from("sds_admins")
      .select("id,status")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      const st = (existing as any).status;
      if (st === "approved") {
        return NextResponse.json({ error: "이미 승인된 관리자입니다. 로그인하세요." }, { status: 409 });
      }
      if (st === "pending") {
        return NextResponse.json({ error: "이미 신청되어 승인 대기 중입니다." }, { status: 409 });
      }
      // rejected → 재신청 허용 (pending 으로 초기화)
      const { error } = await sb
        .from("sds_admins")
        .update({ name, status: "pending", approved_by: null, approved_at: null })
        .eq("id", (existing as any).id);
      if (error) throw error;
      return NextResponse.json({ ok: true, status: "pending" });
    }

    const { error } = await sb.from("sds_admins").insert({
      email,
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
