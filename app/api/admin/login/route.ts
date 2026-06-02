export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { isMaster } from "../../../../lib/adminAuth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "이메일을 입력하세요." }, { status: 400 });
    }
    const norm = String(email).trim().toLowerCase();

    let role: "master" | "admin" | null = null;
    let name = norm;

    if (isMaster(norm)) {
      role = "master";
    } else {
      const sb = getSupabase();
      const { data: a } = await sb
        .from("sds_admins")
        .select("name,status")
        .eq("email", norm)
        .maybeSingle();
      if (!a) {
        return NextResponse.json(
          { error: "등록되지 않은 이메일입니다. 먼저 '관리자 등록 신청'을 해주세요." },
          { status: 401 }
        );
      }
      if ((a as any).status === "pending") {
        return NextResponse.json(
          { error: "아직 승인 대기 중입니다. 마스터 승인 후 로그인할 수 있습니다." },
          { status: 403 }
        );
      }
      if ((a as any).status === "rejected") {
        return NextResponse.json({ error: "관리자 등록이 거절되었습니다." }, { status: 403 });
      }
      role = "admin";
      name = (a as any).name || norm;
    }

    if (!role) {
      return NextResponse.json({ error: "로그인할 수 없습니다." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, role, name }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    res.cookies.set("sds_admin", encodeURIComponent(norm), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}

// 로그아웃
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sds_admin", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
