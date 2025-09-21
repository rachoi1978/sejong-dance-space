export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cookieHeader =
    (req as any).headers?.get?.("cookie") ??
    (globalThis as any)?.next?.headers?.get?.("cookie") ??
    "";

  const has = typeof cookieHeader === "string" && cookieHeader.includes("sds_admin=1");
  return NextResponse.json({ ok: !!has });
}
