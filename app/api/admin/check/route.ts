export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { getVerifiedEmail } from "../../../../lib/supabaseAuth";
import { isMaster } from "../../../../lib/adminAuth";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const v = await getVerifiedEmail();
  // 구글 로그인 자체를 안 한 상태
  if (!v) return NextResponse.json({ signedIn: false, ok: false }, { headers: NO_STORE });

  if (isMaster(v.email)) {
    return NextResponse.json(
      { signedIn: true, ok: true, email: v.email, name: v.name, role: "master", status: "approved" },
      { headers: NO_STORE }
    );
  }

  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("sds_admins")
      .select("name,status")
      .eq("email", v.email)
      .maybeSingle();

    const status = (data as any)?.status || "none"; // none | pending | approved | rejected
    return NextResponse.json(
      {
        signedIn: true,
        ok: status === "approved",
        email: v.email,
        name: (data as any)?.name || v.name,
        role: "admin",
        status,
      },
      { headers: NO_STORE }
    );
  } catch (e: any) {
    return NextResponse.json(
      { signedIn: true, ok: false, email: v.email, name: v.name, status: "none", error: e?.message },
      { headers: NO_STORE }
    );
  }
}
