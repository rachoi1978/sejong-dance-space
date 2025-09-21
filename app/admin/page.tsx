'use client';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  _id: string;
  roomId: string; roomName: string;
  dateKey: string; timeKey: string;
  studentId: string; name: string; major: string;
  status: "pending" | "approved" | "rejected" | "canceled";
};

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState({ name: "", studentId: "", status: "pending" });

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/check", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) router.replace("/");
    })();
  }, [router]);

  const load = async () => {
    const url = new URL("/api/reservations", window.location.origin);
    if (q.name) url.searchParams.set("name", q.name);
    if (q.studentId) url.searchParams.set("studentId", q.studentId);
    if (q.status) url.searchParams.set("status", q.status);
    const rows: Row[] = await fetch(url.toString(), { cache: "no-store" }).then(r => r.json());
    setItems(rows);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Row["status"]) => {
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">관리자 승인 페이지</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-4 grid md:grid-cols-5 gap-3">
        <input placeholder="이름" className="p-3 border rounded-lg"
          value={q.name} onChange={(e)=>setQ({...q, name:e.target.value})}/>
        <input placeholder="학번" className="p-3 border rounded-lg"
          value={q.studentId} onChange={(e)=>setQ({...q, studentId:e.target.value})}/>
        <select className="p-3 border rounded-lg" value={q.status}
          onChange={(e)=>setQ({...q, status:e.target.value})}>
          <option value="">(전체)</option>
          <option value="pending">대기</option>
          <option value="approved">승인</option>
          <option value="rejected">거절</option>
          <option value="canceled">취소</option>
        </select>
        <button onClick={load} className="p-3 rounded-lg bg-purple-600 text-white">검색</button>
        <button onClick={() => setQ({ name: "", studentId: "", status: "pending" })} className="p-3 rounded-lg border">초기화</button>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">검색 결과</h2>
        <div className="space-y-3">
          {items.map(it => (
            <div key={it._id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{it.roomName} · {it.dateKey} {it.timeKey}</div>
                <div className="font-semibold">{it.name} ({it.studentId}) · {it.major}</div>
                <div className="text-xs text-gray-500">상태: {it.status}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setStatus(it._id, "approved")} className="px-3 py-2 rounded bg-green-600 text-white">승인</button>
                <button onClick={()=>setStatus(it._id, "rejected")} className="px-3 py-2 rounded bg-red-600 text-white">거절</button>
                <button onClick={()=>setStatus(it._id, "canceled")} className="px-3 py-2 rounded bg-gray-500 text-white">취소</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-gray-500">결과 없음</div>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">사용 완료(과거 승인건)</h2>
        <div className="space-y-3">
          {completed.map(it => (
            <div key={it._id} className="bg-gray-50 p-4 rounded-xl border flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{it.roomName} · {it.dateKey} {it.timeKey}</div>
                <div className="font-semibold">{it.name} ({it.studentId}) · {it.major}</div>
                <div className="text-xs text-gray-500">상태: {it.status}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-200">완료</span>
            </div>
          ))}
          {completed.length === 0 && <div className="text-gray-500">표시할 항목 없음</div>}
        </div>
      </section>
    </div>
  );
}
