export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { resolveAdmin } from "../../../../lib/adminAuth";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const s = await resolveAdmin();
  if (!s) return NextResponse.json({ ok: false }, { headers: NO_STORE });
  return NextResponse.json(
    { ok: true, email: s.email, name: s.name, role: s.role },
    { headers: NO_STORE }
  );
}
