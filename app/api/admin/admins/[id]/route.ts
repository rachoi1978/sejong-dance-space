export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../lib/supabase";
import { resolveAdmin } from "../../../../../lib/adminAuth";
import { logAction } from "../../../../../lib/audit";

// 마스터만 관리자 등록 승인/거절 (+ 로그)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const s = await resolveAdmin();
    if (!s || s.role !== "master") {
      return NextResponse.json({ error: "마스터 관리자만 승인할 수 있습니다." }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "");
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const status = action === "approve" ? "approved" : "rejected";
    const sb = getSupabase();
    const { error } = await sb
      .from("sds_admins")
      .update({ status, approved_by: s.email, approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    const { data: a } = await sb.from("sds_admins").select("email,name").eq("id", id).maybeSingle();
    const t = a ? `관리자 ${(a as any).name}(${(a as any).email})` : id;
    await logAction(s.email, s.name, action === "approve" ? "관리자 승인" : "관리자 거절", t);

    return NextResponse.json({ ok: true, status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
