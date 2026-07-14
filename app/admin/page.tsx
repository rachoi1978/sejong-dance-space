'use client';
import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Row = {
  _id: string; roomId: string; roomName: string;
  dateKey: string; timeKey: string;
  studentId: string; name: string; major: string; capacity: number;
  status: "pending" | "approved" | "rejected" | "canceled";
  decidedBy?: string; decidedByName?: string; decidedAt?: string;
};
type Me = {
  signedIn: boolean; ok: boolean;
  email?: string; name?: string;
  role?: "master" | "admin";
  status?: "none" | "pending" | "approved" | "rejected";
};
type AdminRow = { _id: string; email: string; name: string; status: string };
type LogRow = { _id: string; actorEmail: string; actorName: string; action: string; target: string; createdAt: string };

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function readJSON<T>(res: Response, fallback: T): Promise<T> {
  const t = await res.text();
  if (!t) return fallback;
  try { return JSON.parse(t) as T; } catch { return fallback; }
}
function fmtTime(iso?: string) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }); } catch { return ""; }
}

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const checkMe = async () => {
    const r = await fetch("/api/admin/check", { cache: "no-store" });
    const j = await readJSON<Me>(r, { signedIn: false, ok: false });
    setMe(j);
  };
  useEffect(() => { checkMe(); }, []);

  const signInGoogle = async () => {
    setBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    await checkMe();
  };
  const requestApproval = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/admin/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: me?.name }),
      });
      const j = await readJSON<any>(r, {});
      if (!r.ok || !j.ok) { setMsg(j.error || "승인 요청에 실패했습니다."); return; }
      setMsg("승인 요청이 접수되었습니다. 마스터 승인을 기다려 주세요.");
      await checkMe();
    } finally { setBusy(false); }
  };

  if (!me) return <div className="p-6 text-center text-gray-500">불러오는 중…</div>;

  // 1) 구글 로그인 전
  if (!me.signedIn) {
    return (
      <Shell>
        <h1 className="text-xl font-extrabold text-center text-[#16314f] mb-1">관리자 로그인</h1>
        <p className="text-center text-gray-500 text-sm mb-6">구글 계정으로 안전하게 로그인합니다</p>
        <button onClick={signInGoogle} disabled={busy}
          className="w-full py-3 rounded-lg border-2 border-[#16314f] text-[#16314f] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <span className="text-lg">G</span> {busy ? "이동 중…" : "구글로 로그인"}
        </button>
        <a href="/" className="block w-full mt-4 text-center text-xs text-gray-400">← 예약 페이지로</a>
      </Shell>
    );
  }

  // 2) 로그인했지만 관리자 아님
  if (!me.ok) {
    return (
      <Shell>
        <h1 className="text-xl font-extrabold text-center text-[#16314f] mb-1">관리자 승인 요청</h1>
        <p className="text-center text-gray-500 text-sm mb-4">{me.name}<br/><span className="text-xs">{me.email}</span></p>

        {me.status === "pending" && (
          <div className="bg-orange-50 text-orange-700 text-sm rounded-lg p-4 text-center mb-4">
            승인 대기 중입니다.<br/>마스터 관리자의 승인 후 이용할 수 있습니다.
          </div>
        )}
        {me.status === "rejected" && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-4 text-center mb-4">
            관리자 등록이 거절되었습니다.<br/>다시 요청할 수 있습니다.
          </div>
        )}
        {msg && <p className="text-sm mb-3 text-center text-[#ef6644]">{msg}</p>}

        {me.status !== "pending" && (
          <button onClick={requestApproval} disabled={busy}
            className="w-full py-3 rounded-lg bg-[#16314f] text-white font-bold disabled:opacity-50">
            {busy ? "처리 중…" : "관리자 승인 요청"}
          </button>
        )}
        <button onClick={signOut} className="w-full mt-3 text-sm text-gray-500 underline">다른 계정으로 로그인</button>
        <a href="/" className="block w-full mt-2 text-center text-xs text-gray-400">← 예약 페이지로</a>
      </Shell>
    );
  }

  return <Dashboard me={me} onSignOut={signOut} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm">{children}</div>
    </div>
  );
}

function Dashboard({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState({ text: "", status: "" });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const url = new URL("/api/reservations", window.location.origin);
    if (q.text.trim()) { url.searchParams.set("name", q.text.trim()); url.searchParams.set("studentId", q.text.trim()); }
    if (q.status) url.searchParams.set("status", q.status);
    const r = await fetch(url.toString(), { cache: "no-store" });
    setItems(await readJSON<Row[]>(r, []));
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
    if (r.status === 401) { alert("세션이 만료되었습니다. 다시 로그인해 주세요."); onSignOut(); return; }
    await r.text(); await load();
  };

  const approver = (it: Row) => {
    if (it.status !== "approved" && it.status !== "rejected") return "—";
    const who = it.decidedByName || it.decidedBy;
    if (!who) return "—";
    const when = fmtTime(it.decidedAt);
    return when ? `${who} (${when})` : who;
  };

  const pendingOnly = items.filter((it) => it.status === "pending");
  const others = items.filter((it) => it.status !== "pending");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{me.name} {me.role === "master" ? "· 마스터" : "· 관리자"}</span>
          <a href="/" className="px-3 py-1.5 rounded-lg border text-[#16314f]">예약 페이지</a>
          <button onClick={onSignOut} className="px-3 py-1.5 rounded-lg border">로그아웃</button>
        </div>
      </div>

      <AdminManager me={me} />

      <div className="bg-white p-4 rounded-xl shadow mb-4 grid md:grid-cols-5 gap-3">
        <input placeholder="이름 또는 학번 검색" className="p-3 border rounded-lg text-gray-900 placeholder-gray-400" value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} />
        <select className="p-3 border rounded-lg text-gray-900" value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}>
          <option value="">상태(전체)</option><option value="pending">대기</option><option value="approved">승인</option><option value="rejected">거절</option>
        </select>
        <button onClick={load} className="p-3 rounded-lg bg-purple-600 text-white">검색</button>
        <button onClick={() => { setQ({ text: "", status: "" }); load(); }} className="p-3 rounded-lg border">초기화</button>
        <div className="text-sm text-gray-500 flex items-center">7초마다 자동 갱신</div>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">승인/거절 대기 ({pendingOnly.length})</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="p-3 text-left">날짜/시간</th><th className="p-3 text-left">대관장소</th><th className="p-3 text-left">이름</th><th className="p-3 text-left">학번</th><th className="p-3 text-left">상태</th><th className="p-3 text-left">조치</th>
            </tr></thead>
            <tbody>
              {pendingOnly.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-3">{it.dateKey} {it.timeKey}</td><td className="p-3">{it.roomName}</td><td className="p-3">{it.name}</td><td className="p-3">{it.studentId}</td>
                  <td className="p-3"><span className="text-orange-600">대기</span></td>
                  <td className="p-3"><div className="flex gap-2">
                    <button onClick={() => setStatus(it._id, "approved")} className="px-3 py-1 rounded bg-green-600 text-white">승인</button>
                    <button onClick={() => setStatus(it._id, "rejected")} className="px-3 py-1 rounded bg-red-600 text-white">거절</button>
                  </div></td>
                </tr>
              ))}
              {pendingOnly.length === 0 && <tr><td className="p-3 text-gray-500" colSpan={6}>대기 항목 없음</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">처리 완료</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="p-3 text-left">날짜/시간</th><th className="p-3 text-left">대관장소</th><th className="p-3 text-left">이름</th><th className="p-3 text-left">학번</th><th className="p-3 text-left">상태</th><th className="p-3 text-left">승인자(처리자)</th>
            </tr></thead>
            <tbody>
              {others.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-3">{it.dateKey} {it.timeKey}</td><td className="p-3">{it.roomName}</td><td className="p-3">{it.name}</td><td className="p-3">{it.studentId}</td>
                  <td className="p-3">
                    {it.status === "approved" && <span className="text-green-700">승인</span>}
                    {it.status === "rejected" && <span className="text-red-700">거절</span>}
                    {it.status === "canceled" && <span className="text-gray-600">취소</span>}
                  </td>
                  <td className="p-3 text-gray-700">{approver(it)}</td>
                </tr>
              ))}
              {others.length === 0 && <tr><td className="p-3 text-gray-500" colSpan={6}>표시할 항목 없음</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <AuditLog />
    </div>
  );
}

function AdminManager({ me }: { me: Me }) {
  const [data, setData] = useState<{ masters: string[]; admins: AdminRow[] } | null>(null);
  const [open, setOpen] = useState(true);
  const isMaster = me.role === "master";

  const load = async () => {
    const r = await fetch("/api/admin/admins", { cache: "no-store" });
    setData(await readJSON<{ masters: string[]; admins: AdminRow[] }>(r, { masters: [], admins: [] }));
  };
  useEffect(() => { load(); }, []);

  const decide = async (id: string, action: "approve" | "reject") => {
    const r = await fetch(`/api/admin/admins/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await r.text(); await load();
  };

  const pending = (data?.admins || []).filter((a) => a.status === "pending");
  const approved = (data?.admins || []).filter((a) => a.status === "approved");

  return (
    <section className="mb-8 bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">관리자 목록{isMaster && pending.length > 0 && <span className="ml-2 text-xs bg-[#ef6644] text-white rounded-full px-2 py-0.5">승인 대기 {pending.length}</span>}</h2>
        <button onClick={() => setOpen((o) => !o)} className="text-sm text-gray-500">{open ? "접기" : "펼치기"}</button>
      </div>
      {open && (
        <div className="mt-4 space-y-5">
          {isMaster && (
            <div>
              <h3 className="text-sm font-semibold text-[#16314f] mb-2">승인 대기 (마스터만 처리)</h3>
              {pending.length === 0 ? <p className="text-sm text-gray-500">대기 중인 신청 없음</p> : (
                <div className="space-y-2">
                  {pending.map((a) => (
                    <div key={a._id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="text-sm"><b>{a.name}</b> · {a.email}</div>
                      <div className="flex gap-2">
                        <button onClick={() => decide(a._id, "approve")} className="px-3 py-1 rounded bg-green-600 text-white text-sm">승인</button>
                        <button onClick={() => decide(a._id, "reject")} className="px-3 py-1 rounded bg-red-600 text-white text-sm">거절</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-[#16314f] mb-2">승인된 관리자</h3>
            <ul className="text-sm space-y-1">
              {(data?.masters || []).map((m) => <li key={m} className="text-gray-700">👑 {m} <span className="text-xs text-gray-400">(마스터)</span></li>)}
              {approved.map((a) => <li key={a._id} className="text-gray-700">{a.name} · {a.email}</li>)}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function AuditLog() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [open, setOpen] = useState(true);
  const load = async () => {
    const r = await fetch("/api/admin/logs", { cache: "no-store" });
    const j = await readJSON<{ logs: LogRow[] }>(r, { logs: [] });
    setLogs(j.logs || []);
  };
  useEffect(() => { load(); }, []);

  return (
    <section className="mb-8 bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">승인 기록 (누가·언제·무엇을)</h2>
        <div className="flex gap-3 items-center">
          <button onClick={load} className="text-sm text-purple-600">새로고침</button>
          <button onClick={() => setOpen((o) => !o)} className="text-sm text-gray-500">{open ? "접기" : "펼치기"}</button>
        </div>
      </div>
      {open && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="p-2 text-left">시각</th><th className="p-2 text-left">처리자</th><th className="p-2 text-left">행위</th><th className="p-2 text-left">대상</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t">
                  <td className="p-2 whitespace-nowrap text-gray-500">{fmtTime(l.createdAt)}</td>
                  <td className="p-2 whitespace-nowrap">{l.actorName || l.actorEmail}</td>
                  <td className="p-2 whitespace-nowrap font-semibold text-[#16314f]">{l.action}</td>
                  <td className="p-2 text-gray-700">{l.target}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td className="p-2 text-gray-500" colSpan={4}>기록 없음</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
