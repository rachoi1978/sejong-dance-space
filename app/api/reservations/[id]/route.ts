export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const $set: any = { updatedAt: new Date().toISOString() };

    if (typeof body.status === "string") {
      if (!["pending","approved","rejected","canceled"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      $set.status = body.status;
    }
    if (body.capacity !== undefined) {
      const c = Math.max(1, parseInt(String(body.capacity), 10) || 1);
      $set.capacity = c;
    }
    if (typeof body.major === "string") $set.major = body.major;
    if (typeof body.name === "string") $set.name = body.name;
    if (typeof body.studentId === "string") $set.studentId = body.studentId;

    const db = await getDb();
    const r = await db.collection("reservations").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set },
      { returnDocument: "after" }
    );
    return NextResponse.json({ ok: true, doc: r.value });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
