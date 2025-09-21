import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const status = String(body.status || "");
  if (!["pending","approved","rejected","canceled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const r = await db.collection("reservations").findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { status, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return NextResponse.json({ ok: true, doc: r.value });
}
