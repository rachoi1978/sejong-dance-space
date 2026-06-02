export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { resolveAdmin } from "../../../../lib/adminAuth";

export async function GET(req: Request) {
  const s = await resolveAdmin(req);
  if (!s) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true, email: s.email, name: s.name, role: s.role });
}
