export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";
import { createAuthClient } from "../../../lib/supabaseAuth";

// 승인이 필요한 예약인지: 승인필요 연습실 / 새벽(23~07) / 주말
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
    roomId: r.room_id, roomName: r.room_name,
    dateKey: r.date_key, timeKey: r.time_key,
    studentId: r.student_id, name: r.name, major: r.major ?? "",
    capacity: r.capacity ?? 1,
    status: r.status,
    userId: r.user_id ?? null,
    decidedBy: r.decided_by ?? undefined,
    decidedByName: r.decided_by_name ?? undefined,
    decidedAt: r.decided_at ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

async function getAuthedUser() {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

// 로그인한 사용자만 예약 현황을 볼 수 있다 (개인정보 보호)
export async function GET(req: Request) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

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

// 예약 생성: 신원은 클라이언트가 아니라 서버가 프로필에서 가져온다 (도용 불가)
export async function POST(req: Request) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: "구글 로그인이 필요합니다." }, { status: 401 });

    const sb = getSupabase();
    const { data: p } = await sb
      .from("sds_profiles")
      .select("name,student_id,major")
      .eq("id", user.id)
      .maybeSingle();
    if (!p) return NextResponse.json({ error: "프로필 등록이 필요합니다." }, { status: 403 });

    const body = await req.json();
    const roomId = String(body.roomId || "");
    const roomName = String(body.roomName || "");
    const dateKey = String(body.dateKey || "");
    const timeKey = String(body.timeKey || "");
    if (!roomId || !roomName || !dateKey || !timeKey) {
      return NextResponse.json({ error: "요청이 올바르지 않습니다." }, { status: 400 });
    }

    // 같은 방·날짜·시간 중복 방지
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
      user_id: user.id,
      room_id: roomId,
      room_name: roomName,
      date_key: dateKey,
      time_key: timeKey,
      student_id: (p as any).student_id,
      name: (p as any).name,
      major: (p as any).major || "",
      capacity: 1,
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
