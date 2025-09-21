'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  _id: string;
  roomId: string; roomName: string;
  dateKey: string; timeKey: string;
  studentId: string; name: string; major: string;
  capacity: number;
  status: "pending" | "approved" | "rejected" | "canceled";
};

async function readJSON<T>(res: Response, fallback: T): Promise<T> {
  const t = await res.text();
  if (!t) return fallback;
  try { return JSON.parse(t) as T; } catch { return fallback; }
}

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState({ text: "", status: "" });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/check", { cache: "no-store" });
      const j = await readJSON<{ok?:boolean}>(r, { ok: false } as any);
      if (!j?.ok) router.replace("/");
    })();
  }, [router]);

  const load = async () => {
    const url = new URL("/api/reservations", window.location.origin);
    if (q.text.trim()) {
      url.searchParams.set("name", q.text.trim());
      url.searchParams.set("studentId", q.text.trim());
    }
    if (q.status) url.searchParams.set("status", q.status);
    const r = await fetch(url.toString(), { cache: "no-store" });
    const rows = await readJSON<Row[]>(r, []);
    setItems(rows);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(load, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [q.text, q.status]);

  const setStatus = async (id: string, status: Row["status"]) => {
    const r = await fetch(`/api/reservations/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await r.text();
    await load();
  };

  const now = new Date();
  const completed = useMemo(() => {
    return items.filter(it => {
      if (it.status !== "approved") return false;
      const d = new Date(`${it.dateKey} ${it.timeKey}`);
      return d.getTime() < now.getTime();
    });
  }, [items, now]);

  const pendingOnly = items.filter(it => it.status === "pending");
  const others = items.filter(it => it.status !== "pending");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">관리자 페이지</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-4 grid md:grid-cols-5 gap-3">
        <input
          placeholder="이름 또는 학번 검색"
          className="p-3 border rounded-lg text-gray-900 placeholder-gray-400"
          value={q.text}
          onChange={(e)=>setQ({...q, text:e.target.value})}
        />
        <select
          className="p-3 border rounded-lg text-gray-900"
          value={q.status}
          onChange={(e)=>setQ({...q, status:e.target.value})}
        >
          <option value="">상태(전체)</option>
          <option value="pending">대기</option>
          <option value="approved">승인</option>
          <option value="rejected">거절</option>
          <option value="canceled">취소</option>
        </select>
        <button onClick={load} className="p-3 rounded-lg bg-purple-600 text-white">검색</button>
        <button onClick={() => { setQ({ text: "", status: "" }); load(); }} className="p-3 rounded-lg border">초기화</button>
        <div className="text-sm text-gray-500 flex items-center">실시간(7초 간격) 갱신</div>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">승인/거절 대기 목록</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">날짜/시간</th>
                <th className="p-3 text-left">대관장소</th>
                <th className="p-3 text-left">이름</th>
                <th className="p-3 text-left">학번</th>
                <th className="p-3 text-left">사용인원</th>
                <th className="p-3 text-left">승인상태</th>
                <th className="p-3 text-left">조치</th>
              </tr>
            </thead>
            <tbody>
              {pendingOnly.map(it => (
                <tr key={it._id} className="border-t">
                  <td className="p-3">{it.dateKey} {it.timeKey}</td>
                  <td className="p-3">{it.roomName}</td>
                  <td className="p-3">{it.name}</td>
                  <td className="p-3">{it.studentId}</td>
                  <td className="p-3">{it.capacity}</td>
                  <td className="p-3"><span className="text-orange-600">대기</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setStatus(it._id,"approved")} className="px-3 py-1 rounded bg-green-600 text-white">승인</button>
                      <button onClick={()=>setStatus(it._id,"rejected")} className="px-3 py-1 rounded bg-red-600 text-white">거절</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingOnly.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={7}>대기 항목 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">기타/사용 완료</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">날짜/시간</th>
                <th className="p-3 text-left">대관장소</th>
                <th className="p-3 text-left">이름</th>
                <th className="p-3 text-left">학번</th>
                <th className="p-3 text-left">사용인원</th>
                <th className="p-3 text-left">승인상태</th>
              </tr>
            </thead>
            <tbody>
              {others.map(it => (
                <tr key={it._id} className="border-t">
                  <td className="p-3">{it.dateKey} {it.timeKey}</td>
                  <td className="p-3">{it.roomName}</td>
                  <td className="p-3">{it.name}</td>
                  <td className="p-3">{it.studentId}</td>
                  <td className="p-3">{it.capacity}</td>
                  <td className="p-3">
                    {it.status === "approved" && <span className="text-green-700">승인</span>}
                    {it.status === "rejected" && <span className="text-red-700">거절</span>}
                    {it.status === "canceled" && <span className="text-gray-600">취소</span>}
                    {it.status === "pending" && <span className="text-orange-600">대기</span>}
                  </td>
                </tr>
              ))}
              {others.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={6}>표시할 항목 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          총 {completed.length}건이 사용 완료(과거 승인건)입니다.
        </div>
      </section>
    </div>
  );
}
