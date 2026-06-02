export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { resolveAdmin } from "../../../../lib/adminAuth";

// 로그인한 관리자라면 누구나 승인 기록(로그)을 볼 수 있다.
export async function GET(req: Request) {
  try {
    const s = await resolveAdmin(req);
    if (!s) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });

    const sb = getSupabase();
    const { data, error } = await sb
      .from("sds_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;

    const logs = (data || []).map((l: any) => ({
      _id: l.id,
      actorEmail: l.actor_email,
      actorName: l.actor_name,
      action: l.action,
      target: l.target,
      createdAt: l.created_at,
    }));
    return NextResponse.json({ logs });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
