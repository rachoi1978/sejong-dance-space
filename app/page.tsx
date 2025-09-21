'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Trophy, CheckCircle, AlertCircle, Menu, Shield, LogIn, Edit3, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

async function readJSON<T>(res: Response, fallback: T): Promise<T> {
  const t = await res.text();
  if (!t) return fallback;
  try { return JSON.parse(t) as T; } catch { return fallback; }
}

export default function Home() {
  const router = useRouter();

  // --- login state (name + studentId only) ---
  const [userInfo, setUserInfo] = useState<{ studentId: string; name: string }>(
    { studentId: '', name: '' }
  );
  const loggedIn = Boolean(userInfo.studentId && userInfo.name);
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginSid, setLoginSid] = useState('');

  // --- UI/navigation ---
  const [currentScreen, setCurrentScreen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  // --- reservation data (local mirror for quick UI) ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<any>({});
  const [serverItems, setServerItems] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editCapacity, setEditCapacity] = useState<string>('');
  const [editMajor, setEditMajor] = useState<string>('');

  // --- admin login (as before) ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminError, setAdminError] = useState('');

  // localStorage keys
  const LS_KEYS = {
    reservations: 'sds_reservations_v4',
    userInfo: 'sds_userInfo_v4',
  };

  // load persisted
  useEffect(() => {
    try {
      const u = localStorage.getItem(LS_KEYS.userInfo);
      if (u) {
        const parsed = JSON.parse(u);
        setUserInfo({ studentId: parsed.studentId || '', name: parsed.name || '' });
      }
      const r = localStorage.getItem(LS_KEYS.reservations);
      if (r) setReservations(JSON.parse(r));
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.userInfo, JSON.stringify(userInfo)); } catch {} }, [userInfo]);
  useEffect(() => { try { localStorage.setItem(LS_KEYS.reservations, JSON.stringify(reservations)); } catch {} }, [reservations]);

  // rooms
  const rooms = [
    { id: 'ranking', name: '세종연습왕 TOP10', type: 'ranking', needsApproval: false },
    { id: 'saenalC', name: '새날관 C', type: 'open', needsApproval: false },
    { id: 'saenalD', name: '새날관 D', type: 'open', needsApproval: false },
    { id: 'saenalE', name: '새날관 E', type: 'open', needsApproval: false },
    { id: 'gwangB',  name: '광개토관 B', type: 'open', needsApproval: false },
    { id: 'gwangC',  name: '광개토관 C', type: 'open', needsApproval: false },
    { id: 'saenalB',  name: '새날관 B', type: 'approval', needsApproval: true },
    { id: 'gwangA',   name: '광개토관 A', type: 'approval', needsApproval: true },
    { id: 'daeyangHall', name: '대양AI 다목적홀', type: 'approval', needsApproval: true },
  ];
  const roomScreens = rooms.filter(r => r.type !== 'ranking');

  // index map
  const INDEX_HOME = 0;
  const INDEX_RANKING = 1;
  const INDEX_ROOMS_START = 2;
  const INDEX_MY_RESERVATIONS = INDEX_ROOMS_START + roomScreens.length;
  const MAX_INDEX = INDEX_MY_RESERVATIONS;

  const timeSlots = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];

  // ranking dummy
  const topUsers = [
    { rank: 1, name: '김민수', studentId: '20210001', major: '실용무용전공', hours: 120 },
    { rank: 2, name: '이지은', studentId: '20210002', major: 'K-POP댄스전공', hours: 115 },
    { rank: 3, name: '박서준', studentId: '20200003', major: '실용무용전공', hours: 110 },
    { rank: 4, name: '최유나', studentId: '20210004', major: '발레전공', hours: 105 },
    { rank: 5, name: '정다현', studentId: '20190005', major: '현대무용전공', hours: 98 },
    { rank: 6, name: '김태현', studentId: '20210006', major: 'K-POP댄스전공', hours: 95 },
    { rank: 7, name: '이소영', studentId: '20200007', major: '실용무용전공', hours: 92 },
    { rank: 8, name: '박지훈', studentId: '20210008', major: '힙합댄스전공', hours: 88 },
    { rank: 9, name: '한예슬', studentId: '20200009', major: '발레전공', hours: 85 },
    { rank: 10, name: '윤성호', studentId: '20210010', major: '현대무용전공', hours: 82 }
  ];

  // swipe (enabled only after login)
  const handleSwipe = (direction: 'left' | 'right') => {
    if (!loggedIn) return;
    if (direction === 'left' && currentScreen < MAX_INDEX) setCurrentScreen(currentScreen + 1);
    else if (direction === 'right' && currentScreen > 0) setCurrentScreen(currentScreen - 1);
  };
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { if (!loggedIn) return; setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => { if (!loggedIn) return; setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!loggedIn || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleSwipe('left');
    if (distance < -50) handleSwipe('right');
  };

  // keyboard nav for desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!loggedIn) return;
      if (e.key === 'ArrowRight') handleSwipe('left');
      if (e.key === 'ArrowLeft') handleSwipe('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loggedIn, currentScreen]);

  // utils
  const formatDate = (date: Date) => date.toDateString(); // keep toDateString for consistent key
  const formatDateHuman = (date: Date) =>
    date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = Array(firstDay.getDay()).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const getReservationStatus = (roomId: string, date: Date, time: string) => {
    const dateKey = formatDate(date); const timeKey = `${time}`;
    return reservations[roomId]?.[dateKey]?.[timeKey] || null;
  };

  // fetch my reservations from server
  async function loadServerMine(q?: string) {
    if (!loggedIn) return setServerItems([]);
    const url = new URL("/api/reservations", window.location.origin);
    const search = q || userInfo.name || userInfo.studentId;
    if (userInfo.name) url.searchParams.set("name", userInfo.name);
    if (userInfo.studentId) url.searchParams.set("studentId", userInfo.studentId);
    if (search) url.searchParams.set("name", search);
    const r = await fetch(url.toString(), { cache: "no-store" });
    const rows = await readJSON<any[]>(r, []);
    setServerItems(rows || []);
  }
  useEffect(() => { if (loggedIn) loadServerMine(); }, [loggedIn]);

  // set of my reserved dateKeys for calendar dots
  const myDateKeys = useMemo(() => {
    const s = new Set<string>();
    for (const it of serverItems) s.add(it.dateKey);
    return s;
  }, [serverItems]);

  // reserve immediately by clicking time (requires login)
  async function persistReservation(payload: {
    roomId: string; roomName: string; dateKey: string; timeKey: string;
    studentId: string; name: string; major?: string; capacity?: number;
  }) {
    try {
      const r = await fetch("/api/reservations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const j = await readJSON<{ ok?: boolean; id?: string; status?: string; error?: string }>(r, {} as any);
      if (!r.ok || !j?.ok) throw new Error(j?.error || "예약 오류");
      return j;
    } catch (e:any) {
      alert(e?.message || "예약 중 오류");
      return null;
    }
  }

  const makeReservation = async (roomId: string, date: Date, time: string) => {
    if (!loggedIn) { setShowLogin(true); return; }
    const room = rooms.find(r => r.id === roomId);
    const dateKey = formatDate(date); const timeKey = `${time}`;
    const res = await persistReservation({
      roomId, roomName: room?.name || roomId, dateKey, timeKey,
      studentId: userInfo.studentId.trim(), name: userInfo.name.trim(),
      capacity: 1
    });
    if (!res) return;
    const status = res.status || 'pending';
    const newReservation = {
      studentId: userInfo.studentId.trim(), name: userInfo.name.trim(),
      major: '', capacity: 1, status, timestamp: new Date().toISOString()
    };
    setReservations((prev: any) => ({
      ...prev,
      [roomId]: { ...(prev[roomId]||{}), [dateKey]: { ...(prev[roomId]?.[dateKey]||{}), [timeKey]: newReservation } }
    }));
    loadServerMine(); // refresh my list for calendar dots
  };

  const cancelReservationLocalOnly = (roomId: string, date: Date, time: string) => {
    const dateKey = formatDate(date); const timeKey = `${time}`;
    setReservations((prev: any) => {
      const next = { ...prev };
      if (next[roomId] && next[roomId][dateKey]) {
        delete next[roomId][dateKey][timeKey];
        if (Object.keys(next[roomId][dateKey]).length === 0) delete next[roomId][dateKey];
        if (Object.keys(next[roomId]).length === 0) delete next[roomId];
      }
      return next;
    });
  };

  // --- Screens ---
  const renderHome = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-gray-900">
        <h1 className="text-3xl font-bold text-center mb-2">세종댄스스페이스</h1>
        <p className="text-center text-gray-600 mb-6">실용무용과 연습실 예약 시스템</p>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• 로그인(이름, 학번) 후 TOP10으로 이동합니다.</p>
          <p>• 예약 페이지에서는 날짜와 시간만 클릭하면 즉시 예약됩니다.</p>
          <p>• 23:00 이후 또는 일부 홀(새날관 B, 광개토관 A)은 승인 절차가 필요합니다.</p>
          <p className="text-red-600">• 노쇼 금지, 미사용 시 반드시 취소</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-white font-semibold hover:bg-purple-700"
        >
          <LogIn size={18}/> 로그인
        </button>
      </div>
    </div>
  );

  const renderRanking = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <Trophy className="mx-auto mb-4 text-yellow-500" size={48} />
          <h2 className="text-3xl font-bold text-purple-800 mb-2">세종연습왕 TOP 10</h2>
          <p className="text-gray-600">이번 달 연습실 사용시간 랭킹</p>
        </div>
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div key={user.rank} className={`bg-white rounded-xl p-4 shadow-md flex items-center ${index < 3 ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${
                index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-amber-600 text-white' : 'bg-purple-100 text-purple-800'}`}>{user.rank}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.studentId} | {user.major}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600">{user.hours}</span>
                    <p className="text-xs text-gray-500">시간</p>
                  </div>
                </div>
              </div>
              {index < 3 && <Trophy className={`ml-2 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} size={24} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoom = (room: any) => (
    <div className={`min-h-screen p-4 ${room.type === 'approval' ? 'bg-gradient-to-br from-orange-50 to-red-50' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-lg p-6 mb-6 bg-white text-gray-900 ${room.type === 'approval' ? 'border-2 border-orange-200' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{room.name}</h2>
              <p className="text-sm text-gray-700 flex items-center">
                {room.needsApproval ? (<><AlertCircle className="mr-1 text-orange-500" size={16} />승인 필요</>) : (<><CheckCircle className="mr-1 text-green-500" size={16} />즉시 사용 가능</>)}
              </p>
            </div>
            <div className="text-right"><p className="text-sm text-gray-700">{new Date(formatDate(selectedDate)).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 text-gray-900">
              <button type="button" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
              <h3 className="text-lg font-semibold">{selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}</h3>
              <button type="button" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-gray-900">
              {['일','월','화','수','목','금','토'].map(day => (<div key={day} className="text-center text-sm font-medium p-2">{day}</div>))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(selectedDate).map((date, i) => {
                const dk = date ? formatDate(date) : '';
                const mine = date && myDateKeys.has(dk);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => date && setSelectedDate(date)}
                    className={`relative p-2 text-sm rounded-lg ${
                      !date ? 'invisible' :
                      date.toDateString() === selectedDate.toDateString()
                        ? 'bg-purple-500 text-white'
                        : 'hover:bg-purple-100 text-gray-900'
                    }`}
                    disabled={!date}
                  >
                    {date?.getDate()}
                    {mine && date && (
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-1 block w-1.5 h-1.5 rounded-full bg-purple-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots: click to reserve */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900"><Clock className="mr-2" size={20} />시간 선택 (클릭하면 바로 예약)</h4>
            <div className="grid grid-cols-4 gap-3">
              {timeSlots.map(time => {
                const reservation = getReservationStatus(room.id, selectedDate, time);
                const hour = parseInt(time.split(':')[0], 10);
                const isLateNight = hour >= 23;

                const mine = reservation && reservation.studentId === userInfo.studentId && reservation.name === userInfo.name;

                return (
                  <button
                    type="button"
                    key={time}
                    onClick={() => {
                      if (!loggedIn) { setShowLogin(true); return; }
                      if (reservation) {
                        if (mine) {
                          // local cancel only (server cancel API not yet implemented)
                          cancelReservationLocalOnly(room.id, selectedDate, time);
                          loadServerMine();
                        }
                      } else {
                        makeReservation(room.id, selectedDate, time);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      reservation
                        ? mine
                          ? 'bg-blue-500 text-white hover:bg-blue-600 ring-2 ring-blue-300'
                          : 'bg-blue-500 text-white cursor-not-allowed'
                        : isLateNight || room.needsApproval
                        ? room.needsApproval
                          ? 'bg-orange-100 border-2 border-orange-400 text-orange-700 hover:bg-orange-200'
                          : 'bg-red-100 border-2 border-red-400 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 border-2 border-green-400 text-green-700 hover:bg-green-200'
                    } ${mine ? 'relative after:content-["내_예약"] after:absolute after:-top-2 after:-right-2 after:text-[10px] after:bg-purple-600 after:text-white after:px-1.5 after:py-0.5 after:rounded' : ''}`}
                    disabled={Boolean(reservation && !mine)}
                    title={!loggedIn ? '로그인 후 이용' : reservation ? (mine ? '클릭하면 취소' : '다른 사용자의 예약') : '클릭하여 예약'}
                  >
                    <div className="text-gray-900">{time}</div>
                    {reservation && (
                      <div className="text-xs mt-1 text-gray-900">
                        {reservation.status === 'approved'
                          ? (<CheckCircle size={12} className="inline mr-1" />)
                          : (<AlertCircle size={12} className="inline mr-1" />)}
                        {reservation.name}
                      </div>
                    )}
                    {!reservation && (isLateNight || room.needsApproval) && (
                      <div className="text-xs mt-1 text-gray-700">{room.needsApproval ? '승인필요' : '23:00 이후 승인필요'}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // My Reservations page (shows date & time)
  const [nameQuery, setNameQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const renderMy = () => {
    const mine = serverItems || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4 text-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">내 예약 현황</h2>

          <div className="bg-white p-4 rounded-xl shadow mb-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">이름</label>
                <input type="text" placeholder="예: 김민수" className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">학번</label>
                <input type="text" placeholder="예: 20210001" className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400" value={idQuery} onChange={(e) => setIdQuery(e.target.value)} />
              </div>
              <div className="flex items-end">
                <button onClick={() => loadServerMine(nameQuery || idQuery)} className="w-full p-3 rounded-lg bg-purple-600 text-white">검색</button>
              </div>
            </div>
          </div>

          {mine.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow"><p className="text-gray-700">표시할 예약이 없습니다.</p></div>
          ) : (
            <div className="space-y-3">
              {mine.sort((a, b) => new Date(a.dateKey + ' ' + a.timeKey).getTime() - new Date(b.dateKey + ' ' + b.timeKey).getTime())
                .map((item: any) => (
                <div key={item._id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">{item.roomName}</div>
                    <div className="text-lg font-semibold text-purple-700">{item.dateKey} {item.timeKey}</div>
                    <div className="text-xs text-gray-600">{item.status === 'approved' ? '승인됨' : item.status === 'rejected' ? '거절됨' : item.status === 'canceled' ? '취소됨' : '승인대기'} · 신청자 {item.name} · 학번 {item.studentId} · {item.capacity ?? 1}명</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center gap-1" onClick={() => { setEditItem(item); setEditCapacity(String(item.capacity||'1')); setEditMajor(String(item.major||'')); }}><Edit3 size={16}/>수정</button>
                    <button className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600" onClick={() => {
                      // local-only cancel UI
                      const d = new Date(item.dateKey);
                      cancelReservationLocalOnly(item.roomId, d, item.timeKey);
                    }}>취소</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // edit modal (optional fields)
  const renderEditModal = () => (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${editItem ? '' : 'hidden'}`}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md text-gray-900">
        <h3 className="text-xl font-bold mb-4 text-center">예약 수정</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-900 mb-2">세부전공(선택)</label>
            <input type="text" value={editMajor} onChange={(e)=>setEditMajor(e.target.value)} className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400" placeholder="전공" />
          </div>
          <div><label className="block text-sm font-medium text-gray-900 mb-2">사용인원(선택)</label>
            <input type="number" min={1} value={editCapacity} onChange={(e)=>setEditCapacity(e.target.value)} className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400" placeholder="예: 1" />
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button onClick={()=>setEditItem(null)} className="flex-1 px-4 py-2 border rounded-lg">닫기</button>
          <button
            onClick={async ()=>{
              if (!editItem) return;
              const payload: any = {};
              if (editMajor !== undefined) payload.major = editMajor;
              if (editCapacity) payload.capacity = Math.max(1, Number(editCapacity) || 1);
              const r = await fetch(`/api/reservations/${editItem._id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
              });
              await r.text();
              await loadServerMine();
              setEditItem(null);
            }}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-1"
          ><Save size={16}/>저장</button>
        </div>
      </div>
    </div>
  );

  // choose screen
  useEffect(() => {
    if (currentScreen === INDEX_MY_RESERVATIONS) loadServerMine();
  }, [currentScreen]);

  const renderCurrent = () => {
    if (!loggedIn) return renderHome();
    if (currentScreen === INDEX_HOME) return renderRanking(); // after login, INDEX_HOME acts as TOP10
    if (currentScreen === INDEX_RANKING) return renderRanking();
    if (currentScreen === INDEX_MY_RESERVATIONS) return renderMy();
    const idxInRooms = currentScreen - INDEX_ROOMS_START;
    const theRoom = roomScreens[idxInRooms];
    if (!theRoom) return renderRanking();
    return renderRoom(theRoom);
  };

  return (
    <div
      className="relative overflow-hidden text-gray-900"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
      tabIndex={0}
    >
      {/* Left: menu */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => loggedIn && setShowMenu(!showMenu)}
          className="p-3 rounded-lg shadow-lg bg-white text-gray-900"
          aria-label="메뉴 열기"
          title={loggedIn ? '' : '로그인 후 이용 가능합니다'}
        >
          <Menu size={20} />
        </button>
        {showMenu && loggedIn && (
          <nav className="absolute top-14 left-0 bg-white rounded-xl shadow-2xl p-4 w-64 border text-gray-900 subpixel-antialiased">
            <h3 className="font-bold text-gray-900 mb-4">메뉴</h3>
            <button className="w-full text-left p-3 hover:bg-purple-50 rounded-lg text-gray-900" onClick={() => { setCurrentScreen(INDEX_RANKING); setShowMenu(false); }}>세종연습왕 TOP10</button>
            <div className="border-t my-2" />
            {roomScreens.map((r, i) => {
              const idx = INDEX_ROOMS_START + i;
              return (
                <button key={r.id} className="w-full text-left p-3 hover:bg-purple-50 rounded-lg text-gray-900" onClick={() => { setCurrentScreen(idx); setShowMenu(false); }}>
                  {r.name} {r.needsApproval && <span className="text-xs text-orange-600 ml-1">(승인필요)</span>}
                </button>
              );
            })}
            <div className="border-t my-2" />
            <button className="w-full text-left p-3 hover:bg-purple-50 rounded-lg text-gray-900" onClick={() => { setCurrentScreen(INDEX_MY_RESERVATIONS); setShowMenu(false); }}>내 예약 현황</button>
          </nav>
        )}
      </div>

      {/* Right: user login + admin */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {!loggedIn && (
          <button onClick={() => setShowLogin(true)} className="p-3 rounded-lg shadow-lg bg-white text-gray-900" aria-label="로그인">
            <LogIn size={20} />
          </button>
        )}
        <button onClick={() => setShowAdminLogin(true)} className="p-3 rounded-lg shadow-lg bg-white text-gray-900" aria-label="관리자">
          <Shield size={20} />
        </button>
      </div>

      {renderCurrent()}

      {loggedIn && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-2 shadow-lg text-gray-900">
          <div className="flex items-center space-x-2">
            <button onClick={() => handleSwipe('right')} className="p-1 rounded-full hover:bg-gray-100" aria-label="이전">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">{Math.min(currentScreen, MAX_INDEX)} / {MAX_INDEX}</span>
            <button onClick={() => handleSwipe('left')} className="p-1 rounded-full hover:bg-gray-100" aria-label="다음">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-center">로그인</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">이름</label>
                <input type="text" value={loginName} onChange={(e)=>setLoginName(e.target.value)} className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400" placeholder="예: 김민수" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">학번</label>
                <input type="text" value={loginSid} onChange={(e)=>setLoginSid(e.target.value)} className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400" placeholder="예: 20210001" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setShowLogin(false)} className="flex-1 px-4 py-2 border rounded-lg">취소</button>
              <button
                onClick={()=>{
                  if (!loginName.trim() || !loginSid.trim()) return;
                  setUserInfo({ name: loginName.trim(), studentId: loginSid.trim() });
                  setShowLogin(false);
                  setCurrentScreen(INDEX_RANKING);
                  loadServerMine();
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >로그인</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {renderEditModal()}

      {/* Admin login modal (unchanged behavior) */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-center">관리자 로그인</h3>
            <input type="email" className="w-full p-3 border rounded-lg mb-3 text-gray-900 placeholder-gray-400" placeholder="관리자 이메일" value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} />
            {adminError && <div className="text-red-600 text-sm mb-3">{adminError}</div>}
            <div className="flex gap-2">
              <button onClick={()=>setShowAdminLogin(false)} className="flex-1 px-4 py-2 border rounded-lg">취소</button>
              <button
                onClick={async ()=>{
                  setAdminError('');
                  const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail }) });
                  const j = await readJSON<{ok?:boolean;error?:string}>(r, {} as any);
                  if (r.ok && j?.ok) { setShowAdminLogin(false); router.push('/admin'); } else { setAdminError(j?.error || '로그인 실패'); }
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg" disabled={!adminEmail}
              >들어가기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
