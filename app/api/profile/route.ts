export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";
import { createAuthClient } from "../../../lib/supabaseAuth";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

async function getAuthedUser() {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

// 내 프로필 조회: { signedIn, email, profile }
export async function GET() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ signedIn: false, profile: null }, { headers: NO_STORE });

  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("sds_profiles")
      .select("name,student_id,major")
      .eq("id", user.id)
      .maybeSingle();

    const profile = data
      ? { name: (data as any).name, studentId: (data as any).student_id, major: (data as any).major || "" }
      : null;
    return NextResponse.json(
      { signedIn: true, email: (user.email || "").toLowerCase(), profile },
      { headers: NO_STORE }
    );
  } catch (e: any) {
    return NextResponse.json({ signedIn: true, profile: null, error: e?.message }, { status: 500, headers: NO_STORE });
  }
}

// 최초 1회 프로필 등록 (실명·학번·전공). 학번은 계정당 하나로 고정.
export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "구글 로그인이 필요합니다." }, { status: 401 });

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const studentId = String(body.studentId || "").trim();
    const major = String(body.major || "").trim();

    if (!name || !studentId || !major) {
      return NextResponse.json({ error: "이름·학번·세부전공을 모두 입력해 주세요." }, { status: 400 });
    }
    if (!/^\d{6,10}$/.test(studentId)) {
      return NextResponse.json({ error: "학번은 숫자 6~10자리로 입력해 주세요." }, { status: 400 });
    }

    const sb = getSupabase();

    // 이미 등록된 계정이면 수정 불가(관리자 문의 안내)
    const { data: mine } = await sb.from("sds_profiles").select("id").eq("id", user.id).maybeSingle();
    if (mine) {
      return NextResponse.json({ error: "이미 등록된 계정입니다. 정보 변경은 관리자에게 문의하세요." }, { status: 409 });
    }

    // 같은 학번이 다른 계정에 등록돼 있으면 도용 방지 차단
    const { data: taken } = await sb.from("sds_profiles").select("id").eq("student_id", studentId).maybeSingle();
    if (taken) {
      return NextResponse.json({ error: "이미 등록된 학번입니다. 본인 학번이 맞다면 관리자에게 문의하세요." }, { status: 409 });
    }

    const { error } = await sb.from("sds_profiles").insert({
      id: user.id,
      email: (user.email || "").toLowerCase(),
      name,
      student_id: studentId,
      major,
    });
    if (error) {
      if ((error as any).code === "23505") {
        return NextResponse.json({ error: "이미 등록된 학번입니다. 관리자에게 문의하세요." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, profile: { name, studentId, major } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
