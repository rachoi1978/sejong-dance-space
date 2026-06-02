export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";

// 승인된 예약을 학번별로 합산해 이용시간(슬롯 1개=1시간) 상위 10명 반환
export async function GET() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("sds_reservations")
      .select("student_id,name,major,status")
      .eq("status", "approved")
      .limit(20000);
    if (error) throw error;

    const map = new Map<string, { studentId: string; name: string; major: string; hours: number }>();
    for (const r of (data || []) as any[]) {
      const sid = (r.student_id || "").trim();
      if (!sid) continue;
      const cur = map.get(sid) || { studentId: sid, name: r.name || "", major: r.major || "", hours: 0 };
      cur.hours += 1; // 시간대 슬롯 1개 = 1시간
      if (r.name) cur.name = r.name;
      if (r.major) cur.major = r.major;
      map.set(sid, cur);
    }

    const ranking = Array.from(map.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
      .map((u, i) => ({ rank: i + 1, ...u }));

    return NextResponse.json({ ranking }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
