export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const status = String(body.status || "");
  if (!["pending","approved","rejected","canceled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const db = await getDb();
  const r = await db.collection("reservations").findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { status, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return NextResponse.json({ ok: true, doc: r.value });
}
