export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { resolveAdmin, getMasterEmails } from "../../../../lib/adminAuth";

function toAdmin(a: any) {
  return {
    _id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    status: a.status,
    createdAt: a.created_at,
    approvedBy: a.approved_by ?? null,
    approvedAt: a.approved_at ?? null,
  };
}

// 로그인한 관리자라면 누구나 관리자 목록을 볼 수 있다(서로 열람 가능).
export async function GET(req: Request) {
  try {
    const s = await resolveAdmin(req);
    if (!s) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });

    const sb = getSupabase();
    const { data, error } = await sb
      .from("sds_admins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    return NextResponse.json({
      masters: getMasterEmails(),
      admins: (data || []).map(toAdmin),
      me: { email: s.email, name: s.name, role: s.role },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
