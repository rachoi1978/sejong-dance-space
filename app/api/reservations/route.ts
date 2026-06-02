export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";

// 승인이 필요한 예약인지 판정: 승인필요 연습실 / 새벽(23~07) / 주말
function needsApproval(roomId: string, dateKey: string, timeKey: string) {
  const approvalRooms = ["gwangA", "gwangB", "saenalB", "daeyangHall"];
  const hour = parseInt(timeKey.split(":")[0], 10);
  const isDawn = hour >= 23 || hour < 7;
  let isWeekend = false;
  const d = new Date(dateKey);
  if (!isNaN(d.getTime())) {
    const wd = d.getDay();
    isWeekend = wd === 0 || wd === 6;
  }
  return approvalRooms.includes(roomId) || isDawn || isWeekend;
}

function toRes(r: any) {
  return {
    _id: r.id,
    roomId: r.room_id,
    roomName: r.room_name,
    dateKey: r.date_key,
    timeKey: r.time_key,
    studentId: r.student_id,
    name: r.name,
    major: r.major ?? "",
    capacity: r.capacity ?? 1,
    status: r.status,
    decidedBy: r.decided_by ?? undefined,
    decidedByName: r.decided_by_name ?? undefined,
    decidedAt: r.decided_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name")?.trim();
    const studentId = searchParams.get("studentId")?.trim();
    const roomId = searchParams.get("roomId")?.trim();
    const status = searchParams.get("status")?.trim();

    const sb = getSupabase();
    let query = sb
      .from("sds_reservations")
      .select("*")
      .order("date_key", { ascending: true })
      .order("time_key", { ascending: true })
      .limit(2000);

    const term = name || studentId;
    if (term) query = query.or(`name.ilike.%${term}%,student_id.ilike.%${term}%`);
    if (roomId) query = query.eq("room_id", roomId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json((data || []).map(toRes));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const required = ["roomId", "roomName", "dateKey", "timeKey", "studentId", "name"];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || String(body[k]).trim() === "") {
        return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
      }
    }

    const roomId = String(body.roomId);
    const dateKey = String(body.dateKey);
    const timeKey = String(body.timeKey);
    const capacity = Math.max(1, parseInt(String(body.capacity ?? "1"), 10) || 1);
    const major = typeof body.major === "string" ? body.major : "";

    const sb = getSupabase();

    // 같은 방·날짜·시간에 살아있는 예약이 있으면 거부
    const { data: dup } = await sb
      .from("sds_reservations")
      .select("id")
      .eq("room_id", roomId)
      .eq("date_key", dateKey)
      .eq("time_key", timeKey)
      .neq("status", "canceled")
      .limit(1);
    if (dup && dup.length > 0) {
      return NextResponse.json({ error: "이미 예약된 시간입니다." }, { status: 409 });
    }

    const row = {
      room_id: roomId,
      room_name: String(body.roomName),
      date_key: dateKey,
      time_key: timeKey,
      student_id: String(body.studentId).trim(),
      name: String(body.name).trim(),
      major,
      capacity,
      status: needsApproval(roomId, dateKey, timeKey) ? "pending" : "approved",
    };

    const { data, error } = await sb
      .from("sds_reservations")
      .insert(row)
      .select("id,status")
      .single();
    if (error) {
      if ((error as any).code === "23505") {
        return NextResponse.json({ error: "이미 예약된 시간입니다." }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true, id: (data as any).id, status: (data as any).status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
