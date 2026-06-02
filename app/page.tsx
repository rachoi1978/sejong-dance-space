'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<any>({});
  const [userInfo, setUserInfo] = useState({ studentId: '', name: '', major: '' });
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ studentId: '', name: '' });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rooms = [
    { id: 'ranking', name: '세종연습왕 TOP10', type: 'ranking', needsApproval: false },
    { id: 'gwangA', name: '광개토관 A', type: 'approval', needsApproval: true },
    { id: 'gwangB', name: '스튜디오B', type: 'approval', needsApproval: true },
    { id: 'gwangC', name: '광개토관 C', type: 'open', needsApproval: false },
    { id: 'saenalB', name: '새날관 B', type: 'approval', needsApproval: true },
    { id: 'saenalC', name: '새날관 C', type: 'open', needsApproval: false },
    { id: 'saenalD', name: '새날관 D', type: 'open', needsApproval: false },
    { id: 'saenalE', name: '새날관 E', type: 'open', needsApproval: false },
    { id: 'daeyangHall', name: '대양AI 다목적홀', type: 'approval', needsApproval: true }
  ];
  // 실제 연습실 목록 (맨 앞 ranking 제외). 화면번호: 1=랭킹, 2부터 연습실(2=광개토A)
  const practiceRooms = rooms.slice(1);
  const timeSlots = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
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

  const handleSwipe = (dir: 'left' | 'right') => {
    const maxScreen = 1 + practiceRooms.length; // 1=랭킹, 그 뒤로 연습실
    if (dir === 'left' && currentScreen < maxScreen) setCurrentScreen(currentScreen + 1);
    else if (dir === 'right' && currentScreen > 1) setCurrentScreen(currentScreen - 1);
  };
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => { if (!touchStart || !touchEnd) return; const d = touchStart - touchEnd; if (d > 50) handleSwipe('left'); if (d < -50) handleSwipe('right'); };

  const formatDate = (date: Date) => date.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear(), m = date.getMonth();
    const last = new Date(y, m + 1, 0).getDate(), start = new Date(y, m, 1).getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < start; i++) days.push(null);
    for (let d = 1; d <= last; d++) days.push(new Date(y, m, d));
    return days;
  };
  const getReservationStatus = (roomId: string, date: Date, time: string) => reservations[roomId]?.[date.toDateString()]?.[time] || null;

  const loadReservations = async () => {
    try {
      const r = await fetch('/api/reservations', { cache: 'no-store' });
      if (!r.ok) return;
      const rows = await r.json();
      const nested: any = {};
      (Array.isArray(rows) ? rows : []).forEach((x: any) => {
        if (x.status === 'canceled') return;
        const rid = x.roomId, dk = x.dateKey, tk = x.timeKey;
        if (!rid || !dk || !tk) return;
        if (!nested[rid]) nested[rid] = {};
        if (!nested[rid][dk]) nested[rid][dk] = {};
        nested[rid][dk][tk] = { _id: x._id, studentId: x.studentId, name: x.name, major: x.major, status: x.status, timestamp: x.createdAt };
      });
      setReservations(nested);
    } catch {}
  };
  useEffect(() => {
    loadReservations();
    const t = setInterval(loadReservations, 8000);
    return () => clearInterval(t);
  }, []);

  const makeReservation = async (roomId: string, date: Date, time: string) => {
    if (!userInfo.studentId || !userInfo.name) { alert('로그인이 필요합니다.'); return; }
    if (!userInfo.major) { setSelectedRoom(roomId); setSelectedTime(time); setShowUserForm(true); return; }
    const room = rooms.find(r => r.id === roomId);
    const dk = date.toDateString();
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, roomName: room?.name || roomId, dateKey: dk, timeKey: time, studentId: userInfo.studentId, name: userInfo.name, major: userInfo.major }),
      });
      if (res.status === 409) { alert('이미 예약된 시간입니다.'); await loadReservations(); return; }
      if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || '예약에 실패했습니다.'); return; }
      await loadReservations();
    } catch { alert('예약 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); }
  };
  const cancelReservation = async (resv: any) => {
    if (!resv?._id) { await loadReservations(); return; }
    try {
      await fetch(`/api/reservations/${resv._id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userInfo.studentId, name: userInfo.name }),
      });
      await loadReservations();
    } catch {}
  };
  const openCancelModal = (roomId: string, date: Date, time: string, r: any) => { setCancelTarget({ roomId, date, time, reservation: r }); setShowCancelModal(true); };
  const getMyReservations = () => {
    const list: any[] = [];
    Object.entries(reservations).forEach(([roomId, rr]) => {
      Object.entries(rr as any).forEach(([date, dr]) => {
        Object.entries(dr as any).forEach(([time, r]) => {
          if ((r as any).studentId === userInfo.studentId && (r as any).name === userInfo.name) {
            const room = rooms.find(x => x.id === roomId);
            list.push({ roomId, roomName: room?.name || roomId, date: new Date(date), time, ...(r as any) });
          }
        });
      });
    });
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  const handleLogin = () => { if (loginForm.studentId.trim() && loginForm.name.trim()) { setUserInfo({ studentId: loginForm.studentId.trim(), name: loginForm.name.trim(), major: '' }); setShowLogin(false); setCurrentScreen(1); } };
  const handleLogout = () => { setUserInfo({ studentId:'', name:'', major:'' }); setCurrentScreen(0); };

  const TopRightLogo = () => (
    <div className="fixed top-3 right-3 z-40 bg-white/80 rounded-lg p-1 shadow-sm">
      <img src="/logo.png" alt="SDS" className="h-9 w-auto rounded" />
    </div>
  );

  const renderMenu = () => (
    <div className="fixed top-3 left-3 z-50">
      <button onClick={() => setShowMenu(!showMenu)} className="bg-white p-3 rounded-lg shadow-md">
        <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
          <div className={`w-full h-0.5 bg-[#16314f] transition ${showMenu ? 'rotate-45 translate-y-2' : ''}`}></div>
          <div className={`w-full h-0.5 bg-[#16314f] transition ${showMenu ? 'opacity-0' : ''}`}></div>
          <div className={`w-full h-0.5 bg-[#16314f] transition ${showMenu ? '-rotate-45 -translate-y-2' : ''}`}></div>
        </div>
      </button>
      {showMenu && (
        <div className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-4 w-72 border max-h-[70vh] overflow-y-auto">
          <h3 className="font-extrabold text-[#16314f] mb-3 text-lg">메뉴</h3>
          <button onClick={() => { setCurrentScreen(0); setShowMenu(false); }} className="w-full text-left p-3 rounded-lg mb-1 font-semibold text-[#16314f] hover:bg-gray-50">홈</button>
          {userInfo.name ? (
            <button onClick={() => { handleLogout(); setShowMenu(false); }} className="w-full text-left p-3 rounded-lg mb-1 font-semibold text-[#ef6644] hover:bg-orange-50">로그아웃 ({userInfo.name})</button>
          ) : (
            <button onClick={() => { setShowLogin(true); setShowMenu(false); }} className="w-full text-left p-3 rounded-lg mb-1 font-semibold text-[#16314f] hover:bg-gray-50">로그인</button>
          )}
          <button onClick={() => { setCurrentScreen(1); setShowMenu(false); }} className="w-full text-left p-3 rounded-lg mb-1 font-semibold text-[#16314f] hover:bg-gray-50">TOP10 랭킹</button>
          <div className="border-t pt-3 mt-2">
            <h4 className="text-xs font-bold text-gray-400 mb-2">연습실</h4>
            {practiceRooms.map((room, i) => (
              <button key={room.id} onClick={() => { setCurrentScreen(i + 2); setShowMenu(false); }}
                className={`w-full text-left p-2 rounded-lg mb-1 text-sm flex justify-between items-center ${room.needsApproval ? 'text-[#ef6644] hover:bg-orange-50' : 'text-[#16314f] hover:bg-gray-50'}`}>
                {room.name}
                {room.needsApproval && <span className="text-[10px] bg-[#fbe3dc] text-[#ef6644] px-2 py-0.5 rounded-full">승인필요</span>}
              </button>
            ))}
          </div>
          {userInfo.name && (
            <div className="border-t pt-3 mt-2">
              <button onClick={() => { setCurrentScreen(-1); setShowMenu(false); }} className="w-full text-left p-3 rounded-lg font-semibold text-[#16314f] hover:bg-gray-50">내 예약 현황</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMain = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#eef0f2] p-6">
      <img src="/logo.png" alt="SEJONG DANCE SPACE" className="w-64 max-w-[80%] mb-8 rounded-2xl shadow-sm" />
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-md w-full">
        <h3 className="text-base font-extrabold text-[#16314f] mb-3">이용 안내</h3>
        <div className="text-sm text-gray-600 space-y-1.5">
          <p>· 사용 후 반드시 정리·청소해 주세요</p>
          <p>· 새벽(23:00~07:00)·주말은 승인이 필요합니다</p>
          <p className="text-[#ef6644] font-semibold">· 노쇼는 다음 이용에 제약이 있을 수 있습니다</p>
          <p className="text-[#ef6644] font-semibold">· 사용하지 않으면 반드시 취소해 주세요</p>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[#16314f]">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 accent-[#ef6644]" />
          위 내용에 동의합니다
        </label>
      </div>
      {agreed && <button onClick={() => setShowLogin(true)} className="bg-[#16314f] text-white px-10 py-3 rounded-xl text-lg font-bold hover:bg-[#1e436b] transition">시작하기</button>}
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#eef0f2] p-6">
      <a href="/admin" target="_blank" rel="noopener noreferrer" className="fixed top-4 right-4 z-50 text-sm font-semibold text-[#16314f] bg-white border border-[#16314f] px-3 py-1.5 rounded-lg shadow-sm hover:bg-[#16314f] hover:text-white transition">관리자 로그인</a>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <img src="/logo.png" alt="SDS" className="w-40 mx-auto mb-4 rounded-xl" />
        <h1 className="text-xl font-extrabold text-center text-[#16314f] mb-1">로그인</h1>
        <p className="text-center text-gray-500 text-sm mb-6">학번과 이름을 입력해 주세요</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#16314f] mb-1">학번</label>
            <input type="text" value={loginForm.studentId} onChange={(e) => setLoginForm({ ...loginForm, studentId: e.target.value })} className="w-full p-3 border rounded-lg text-[#16314f] focus:ring-2 focus:ring-[#ef6644] outline-none" placeholder="예: 20210001" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#16314f] mb-1">이름</label>
            <input type="text" value={loginForm.name} onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })} className="w-full p-3 border rounded-lg text-[#16314f] focus:ring-2 focus:ring-[#ef6644] outline-none" placeholder="예: 김민수" />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={() => setShowLogin(false)} className="flex-1 px-4 py-2 border rounded-lg text-[#16314f]">취소</button>
          <button onClick={handleLogin} disabled={!loginForm.studentId.trim() || !loginForm.name.trim()} className={`flex-1 px-4 py-2 rounded-lg font-bold ${loginForm.studentId.trim() && loginForm.name.trim() ? 'bg-[#16314f] text-white' : 'bg-gray-200 text-gray-400'}`}>로그인</button>
        </div>
      </div>
    </div>
  );

  const renderRanking = () => (
    <div className="min-h-screen bg-[#eef0f2] p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold text-[#16314f]">세종연습왕 TOP 10</h2>
          <p className="text-gray-500 text-sm">이번 달 연습 시간 랭킹</p>
          {userInfo.name && <p className="mt-3 text-sm text-[#16314f] bg-white rounded-lg py-2 shadow-sm">안녕하세요, <b className="text-[#ef6644]">{userInfo.name}</b>님!</p>}
          <p className="mt-3 text-xs text-[#ef6644]">오른쪽으로 스와이프하면 연습실 예약으로 이동 →</p>
        </div>
        <div className="space-y-2">
          {topUsers.map((u, i) => (
            <div key={u.rank} className={`flex items-center rounded-xl p-3 border ${i < 3 ? 'bg-[#fbe3dc] border-[#ef6644]' : 'bg-white border-gray-200'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm mr-3 ${i < 3 ? 'bg-[#ef6644] text-white' : 'bg-[#eef0f2] text-[#16314f]'}`}>{u.rank}</div>
              <div className="flex-1"><p className="font-bold text-[#16314f] text-sm">{u.name}</p><p className="text-xs text-gray-500">{u.major}</p></div>
              <span className="font-extrabold text-[#ef6644]">{u.hours}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoom = (room: any) => (
    <div className="min-h-screen bg-[#eef0f2] p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#16314f]">{room.name}</h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${room.needsApproval ? 'bg-[#fbe3dc] text-[#ef6644]' : 'bg-[#e6f4ea] text-[#1f7a44]'}`}>{room.needsApproval ? '승인 필요' : '즉시 사용 가능'}</span>
            </div>
            <p className="text-xs text-gray-400">{formatDate(selectedDate)}</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))} className="p-2">←</button>
            <h3 className="font-bold text-[#16314f]">{selectedDate.toLocaleDateString('ko-KR', { year:'numeric', month:'long' })}</h3>
            <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))} className="p-2">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">{['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1 mb-5">
            {getDaysInMonth(selectedDate).map((d, i) => (
              <button key={i} onClick={() => d && setSelectedDate(d)} disabled={!d} className={`py-2 text-sm rounded-lg ${!d ? 'invisible' : d.toDateString() === selectedDate.toDateString() ? 'bg-[#16314f] text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{d?.getDate()}</button>
            ))}
          </div>
          <h4 className="font-bold text-[#16314f] mb-3">시간 선택</h4>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map(time => {
              const r = getReservationStatus(room.id, selectedDate, time);
              const hour = parseInt(time.split(':')[0]);
              const isDawn = hour >= 23 || hour < 7;
              const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
              const special = isDawn || isWeekend;
              const mine = r && r.studentId === userInfo.studentId && r.name === userInfo.name;
              let cls = 'bg-[#e6f4ea] border-[#9bd4af] text-[#1f7a44]';
              if (r) cls = r.status === 'approved' ? 'bg-[#16314f] border-[#16314f] text-white' : r.status === 'pending' ? 'bg-[#fbe3dc] border-[#f4b6a6] text-[#ef6644]' : 'bg-gray-300 border-gray-300 text-white';
              else if (isDawn) cls = 'bg-[#fde8d6] border-[#f0c089] text-[#b9651b]';
              else if (special || room.type === 'approval') cls = 'bg-[#fbe3dc] border-[#f4b6a6] text-[#ef6644]';
              return (
                <button key={time} onClick={() => { if (r) { if (mine) openCancelModal(room.id, selectedDate, time, r); } else makeReservation(room.id, selectedDate, time); }} disabled={!!r && !mine}
                  className={`py-2.5 rounded-lg text-sm font-semibold border-2 ${cls} ${mine ? 'ring-2 ring-offset-1 ring-[#16314f]' : ''}`}>
                  <div>{time}</div>
                  {r && <div className="text-[10px] mt-0.5">{r.status === 'approved' ? '✓ ' : r.status === 'pending' ? '⏳ ' : '✕ '}{r.name}</div>}
                  {!r && (isDawn ? <div className="text-[9px] mt-0.5">새벽·승인</div> : (special || room.type === 'approval') ? <div className="text-[9px] mt-0.5">승인필요</div> : null)}
                  {mine && <div className="text-[9px] mt-0.5 font-bold">클릭하여 취소</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMy = () => {
    const my = getMyReservations();
    return (
      <div className="min-h-screen bg-[#eef0f2] p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <h2 className="text-2xl font-extrabold text-[#16314f] text-center mb-1">내 예약 현황</h2>
          <p className="text-center text-gray-500 text-sm mb-6">{userInfo.name ? `${userInfo.name}님의 예약 내역` : '로그인이 필요합니다'}</p>
          {!userInfo.name ? (
            <div className="bg-white rounded-xl p-8 text-center shadow"><p className="text-gray-600 mb-4">먼저 로그인해 주세요.</p><button onClick={() => setShowLogin(true)} className="bg-[#16314f] text-white px-6 py-3 rounded-lg font-bold">로그인</button></div>
          ) : my.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow"><p className="text-gray-600 mb-4">예약 내역이 없습니다.</p><button onClick={() => setCurrentScreen(2)} className="bg-[#16314f] text-white px-6 py-3 rounded-lg font-bold">연습실 보기</button></div>
          ) : (
            <div className="space-y-3">
              {my.map((r, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow flex justify-between items-start">
                  <div><h3 className="font-bold text-[#16314f]">{r.roomName}</h3><p className="text-sm text-gray-500">{r.date.toLocaleDateString('ko-KR')}</p><p className="font-bold text-[#ef6644] mt-1">{r.time}</p></div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.status === 'approved' ? 'bg-[#e6f4ea] text-[#1f7a44]' : r.status === 'pending' ? 'bg-[#fbe3dc] text-[#ef6644]' : 'bg-gray-200 text-gray-500'}`}>{r.status === 'approved' ? '확정' : r.status === 'pending' ? '승인 대기' : '거절'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUserForm = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-extrabold text-center text-[#16314f] mb-1">세부전공 입력</h3>
        <p className="text-sm text-gray-500 text-center mb-4">예약을 위해 세부전공을 입력해 주세요</p>
        <input type="text" value={userInfo.major} onChange={(e) => setUserInfo({ ...userInfo, major: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#ef6644] outline-none" placeholder="예: 실용무용전공" />
        <div className="flex gap-2 mt-5">
          <button onClick={() => setShowUserForm(false)} className="flex-1 px-4 py-2 border rounded-lg text-[#16314f]">취소</button>
          <button onClick={() => { if (userInfo.major.trim() && selectedRoom && selectedTime) { makeReservation(selectedRoom, selectedDate, selectedTime); setShowUserForm(false); } }} disabled={!userInfo.major.trim()} className={`flex-1 px-4 py-2 rounded-lg font-bold ${userInfo.major.trim() ? 'bg-[#16314f] text-white' : 'bg-gray-200 text-gray-400'}`}>예약</button>
        </div>
      </div>
    </div>
  );

  const renderCancel = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-extrabold text-center text-[#ef6644] mb-3">예약 취소</h3>
        {cancelTarget && (
          <div className="text-center mb-5 bg-[#f7f8fa] rounded-lg p-4">
            <p className="font-bold text-[#16314f]">{rooms.find(r => r.id === cancelTarget.roomId)?.name}</p>
            <p className="text-sm text-gray-500">{formatDate(cancelTarget.date)}</p>
            <p className="font-bold text-[#ef6644] mt-1">{cancelTarget.time}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-[#16314f]">닫기</button>
          <button onClick={() => { if (cancelTarget) { cancelReservation(cancelTarget.reservation); setShowCancelModal(false); setCancelTarget(null); } }} className="flex-1 px-4 py-2 bg-[#ef6644] text-white rounded-lg font-bold">취소하기</button>
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    if (showLogin) return renderLogin();
    if (!userInfo.name) return renderMain();
    if (currentScreen === 0) return renderMain();
    if (currentScreen === 1) return renderRanking();
    if (currentScreen === -1) return renderMy();
    return renderRoom(practiceRooms[currentScreen - 2]);
  };

  return (
    <div className="relative overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} ref={containerRef}>
      {userInfo.name && renderMenu()}
      {!showLogin && <TopRightLogo />}
      {renderScreen()}
      {userInfo.name && currentScreen > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 z-40">
          <button onClick={() => handleSwipe('right')} className="p-1">←</button>
          <span className="text-sm font-semibold text-[#16314f]">{currentScreen} / {practiceRooms.length + 1}</span>
          <button onClick={() => handleSwipe('left')} className="p-1">→</button>
        </div>
      )}
      {showUserForm && renderUserForm()}
      {showCancelModal && renderCancel()}
    </div>
  );
}