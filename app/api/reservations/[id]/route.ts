export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { resolveAdmin } from "../../../../lib/adminAuth";
import { createAuthClient } from "../../../../lib/supabaseAuth";
import { logAction } from "../../../../lib/audit";

// 관리자: 예약 승인/거절 (승인자 기록 + 로그)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const admin = await resolveAdmin();
    if (!admin) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const patch: any = { updated_at: new Date().toISOString() };
    let decision: "approved" | "rejected" | null = null;

    if (typeof body.status === "string") {
      if (!["pending", "approved", "rejected", "canceled"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      patch.status = body.status;
      if (body.status === "approved" || body.status === "rejected") {
        patch.decided_by = admin.email;
        patch.decided_by_name = admin.name;
        patch.decided_at = new Date().toISOString();
        decision = body.status;
      }
    }

    const sb = getSupabase();
    const { error } = await sb.from("sds_reservations").update(patch).eq("id", id);
    if (error) throw error;

    if (decision) {
      const { data: r } = await sb
        .from("sds_reservations")
        .select("room_name,date_key,time_key,name,student_id")
        .eq("id", id)
        .maybeSingle();
      const t = r
        ? `${(r as any).room_name} ${(r as any).date_key} ${(r as any).time_key} / ${(r as any).name}(${(r as any).student_id})`
        : id;
      await logAction(admin.email, admin.name, decision === "approved" ? "예약 승인" : "예약 거절", t);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}

// 본인 예약 취소: 로그인 사용자와 예약의 user_id가 일치해야 함 (도용 불가)
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const supabase = await createAuthClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const sb = getSupabase();
    const { data: row } = await sb
      .from("sds_reservations")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!row) return NextResponse.json({ ok: true });
    if ((row as any).user_id !== u.user.id) {
      return NextResponse.json({ error: "본인 예약만 취소할 수 있습니다." }, { status: 403 });
    }

    const { error } = await sb.from("sds_reservations").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
