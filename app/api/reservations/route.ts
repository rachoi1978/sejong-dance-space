import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

type Doc = {
  _id?: any;
  roomId: string;
  roomName: string;
  dateKey: string;
  timeKey: string;
  studentId: string;
  name: string;
  major: string;
  capacity: number;
  status: "pending" | "approved" | "rejected" | "canceled";
  createdAt: string;
  updatedAt: string;
};

function needsApproval(roomId: string, timeKey: string) {
  const hour = parseInt(timeKey.split(":")[0], 10);
  const lateNight = hour >= 23;
  const alwaysApproval = roomId === "saenalB" || roomId === "gwangA";
  return alwaysApproval || lateNight;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  const studentId = searchParams.get("studentId")?.trim();
  const roomId = searchParams.get("roomId")?.trim();
  const status = searchParams.get("status")?.trim();

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const q: any = {};
  if (name && studentId) {
    q.$or = [
      { name: { $regex: new RegExp(name, "i") } },
      { studentId: { $regex: new RegExp(studentId, "i") } },
    ];
  } else if (name) q.name = { $regex: new RegExp(name, "i") };
  else if (studentId) q.studentId = { $regex: new RegExp(studentId, "i") };
  if (roomId) q.roomId = roomId;
  if (status) q.status = status;

  const rows = await db.collection<Doc>("reservations")
    .find(q)
    .sort({ dateKey: 1, timeKey: 1 })
    .limit(1000)
    .toArray();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const required = ["roomId","roomName","dateKey","timeKey","studentId","name","major","capacity"];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
    }
  }

  const doc: Doc = {
    roomId: String(body.roomId),
    roomName: String(body.roomName),
    dateKey: String(body.dateKey),
    timeKey: String(body.timeKey),
    studentId: String(body.studentId),
    name: String(body.name),
    major: String(body.major),
    capacity: Math.max(1, parseInt(String(body.capacity), 10) || 1),
    status: needsApproval(String(body.roomId), String(body.timeKey)) ? "pending" : "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  await db.collection("reservations").createIndex(
    { roomId: 1, dateKey: 1, timeKey: 1 },
    { unique: true, name: "uniq_room_date_time" }
  );

  const dup = await db.collection<Doc>("reservations").findOne({
    roomId: doc.roomId, dateKey: doc.dateKey, timeKey: doc.timeKey,
    status: { $ne: "canceled" }
  });
  if (dup) return NextResponse.json({ error: "이미 예약된 시간입니다." }, { status: 409 });

  const res = await db.collection<Doc>("reservations").insertOne(doc);
  return NextResponse.json({ ok: true, id: res.insertedId, status: doc.status });
}
