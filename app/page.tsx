'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Trophy, CheckCircle, AlertCircle, Menu } from 'lucide-react';

export default function Home() {
  // 동의 게이트
  const [agreed, setAgreed] = useState(false);

  // 화면 상태
  const [currentScreen, setCurrentScreen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 날짜/예약 상태
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<any>({});
  const [userInfo, setUserInfo] = useState({ studentId: '', name: '', major: '' });

  // 예약 플로우
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  // 메뉴
  const [showMenu, setShowMenu] = useState(false);

  // 로컬 지속화(localStorage)
  const LS_KEYS = {
    reservations: 'sds_reservations_v1',
    userInfo: 'sds_userInfo_v1',
    agreed: 'sds_agreed_v1',
  };

  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_KEYS.reservations);
      if (r) setReservations(JSON.parse(r));
      const u = localStorage.getItem(LS_KEYS.userInfo);
      if (u) setUserInfo(JSON.parse(u));
      const a = localStorage.getItem(LS_KEYS.agreed);
      if (a) setAgreed(a === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.reservations, JSON.stringify(reservations)); } catch {}
  }, [reservations]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.userInfo, JSON.stringify(userInfo)); } catch {}
  }, [userInfo]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.agreed, String(agreed)); } catch {}
    if (!agreed) {
      setCurrentScreen(0);
      setShowMenu(false);
    }
  }, [agreed]);

  // 연습실 설정
  const rooms = [
    { id: 'ranking', name: '세종연습왕 TOP10', type: 'ranking', needsApproval: false },

    // 승인 불필요
    { id: 'saenalC', name: '새날관 C', type: 'open', needsApproval: false },
    { id: 'saenalD', name: '새날관 D', type: 'open', needsApproval: false },
    { id: 'saenalE', name: '새날관 E', type: 'open', needsApproval: false },
    { id: 'gwangB',  name: '광개토관 B', type: 'open', needsApproval: false },
    { id: 'gwangC',  name: '광개토관 C', type: 'open', needsApproval: false },

    // 기본 승인 필요
    { id: 'saenalB',  name: '새날관 B', type: 'approval', needsApproval: true },
    { id: 'gwangA',   name: '광개토관 A', type: 'approval', needsApproval: true },

    // 유지
    { id: 'daeyangHall', name: '대양AI 다목적홀', type: 'approval', needsApproval: true },
  ];
  const roomScreens = rooms.filter(r => r.type !== 'ranking');

  // 스크린 인덱스
  const INDEX_MAIN = 0;
  const INDEX_RANKING = 1;
  const INDEX_ROOMS_START = 2;
  const INDEX_MY_RESERVATIONS = INDEX_ROOMS_START + roomScreens.length;
  const MAX_INDEX = INDEX_MY_RESERVATIONS;

  // 시간대
  const timeSlots = [
    '07:00','08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00','18:00',
    '19:00','20:00','21:00','22:00','23:00'
  ];

  // TOP10 샘플
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

  // 스와이프(동의 전에는 무시)
  const handleSwipe = (direction: 'left' | 'right') => {
    if (!agreed) return;
    if (direction === 'left' && currentScreen < MAX_INDEX) setCurrentScreen(currentScreen + 1);
    else if (direction === 'right' && currentScreen > 0) setCurrentScreen(currentScreen - 1);
  };
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { if (!agreed) return; setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => { if (!agreed) return; setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!agreed || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleSwipe('left');
    if (distance < -50) handleSwipe('right');
  };

  // 날짜 헬퍼
  const formatDate = (date: Date) => date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = Array(firstDay.getDay()).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  // 상태 조회
  const getReservationStatus = (roomId: string, date: Date, time: string) => {
    const dateKey = date.toDateString(); const timeKey = `${time}`;
    return reservations[roomId]?.[dateKey]?.[timeKey] || null;
  };

  // 예약: “시간 먼저 선택 → 정보 입력”
  // 승인 규칙: 23:00 이후는 모두 승인 필요 + (새날B/광개A/대양홀 기본 승인필요)
  const makeReservation = (roomId: string, date: Date, time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    const isLateNight = hour >= 23;
    const room = rooms.find(r => r.id === roomId);
    const needsApproval = (room?.needsApproval ?? false) || isLateNight;

    if (!userInfo.studentId || !userInfo.name || !userInfo.major) {
      setSelectedRoom(roomId);
      setSelectedTime(time);
      setShowUserForm(true);
      return;
    }

    const dateKey = date.toDateString(); const timeKey = `${time}`;
    const newReservation = {
      studentId: userInfo.studentId,
      name: userInfo.name,
      major: userInfo.major,
      status: needsApproval ? 'pending' : 'approved',
      timestamp: new Date().toISOString()
    };

    setReservations((prev: any) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [dateKey]: {
          ...prev[roomId]?.[dateKey],
          [timeKey]: newReservation
        }
      }
    }));
  };

  // 취소
  const cancelReservation = (roomId: string, date: Date, time: string) => {
    const dateKey = date.toDateString(); const timeKey = `${time}`;
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
  const openCancelModal = (roomId: string, date: Date, time: string, reservation: any) => {
    setCancelTarget({ roomId, date, time, reservation }); setShowCancelModal(true);
  };

  // 화면들
  const renderMainScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">세종댄스스페이스</h1>
        <p className="text-lg text-gray-700 mb-6">실용무용과 연습실 예약 시스템</p>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 사용 방법 및 주의사항</h3>
          <div className="text-sm text-gray-600 text-left space-y-2">
            <p>• 학번, 이름, 세부전공을 정확히 입력해주세요</p>
            <p>• 예약 시간을 준수해주세요</p>
            <p>• 사용 후 반드시 청소해주세요</p>
            <p>• 시설 파손 시 즉시 신고해주세요</p>
            <p>• 23:00 이후 예약은 승인 절차가 필요합니다</p>
            <p className="text-red-600 font-medium">• ⚠️ 노쇼는 다음 연습실 사용에 제약이 있을 수 있습니다</p>
            <p className="text-red-600 font-medium">• ⚠️ 연습실 사용을 안할 경우, 반드시 캔슬바랍니다</p>
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4"
            />
            위 내용을 확인했고, 시설 파손/청소/이용수칙에 동의합니다.
          </label>
        </div>

        {/* 시작하기 버튼 제거 → 동의 시 스와이프 안내만 표시 */}
        {agreed && (
          <div className="animate-pulse text-purple-600 opacity-90 flex items-center justify-center">
            <span className="mr-2">오른쪽으로 스와이프하세요</span>
            <ChevronRight className="animate-bounce" size={22} />
          </div>
        )}
      </div>
    </div>
  );

  const renderRankingScreen = () => (
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

  const renderRoomScreen = (room: any) => (
    <div className={`min-h-screen p-4 ${room.type === 'approval' ? 'bg-gradient-to-br from-orange-50 to-red-50' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${room.type === 'approval' ? 'bg-white border-2 border-orange-200' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${room.type === 'approval' ? 'text-orange-800' : 'text-gray-800'}`}>{room.name}</h2>
              <p className="text-sm text-gray-600 flex items-center">
                {room.needsApproval ? (<><AlertCircle className="mr-1 text-orange-500" size={16} />승인 필요</>) : (<><CheckCircle className="mr-1 text-green-500" size={16} />즉시 사용 가능</>)}
              </p>
            </div>
            <div className="text-right"><p className="text-sm text-gray-500">{formatDate(selectedDate)}</p></div>
          </div>

          {/* 캘린더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
              <h3 className="text-lg font-semibold">{selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}</h3>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">{['일','월','화','수','목','금','토'].map(day => (<div key={day} className="text-center text-sm font-medium text-gray-500 p-2">{day}</div>))}</div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(selectedDate).map((date, i) => (
                <button key={i} onClick={() => date && setSelectedDate(date)} className={`p-2 text-sm rounded-lg ${
                  !date ? 'invisible' : date.toDateString() === selectedDate.toDateString() ? 'bg-purple-500 text-white' : 'hover:bg-purple-100 text-gray-700'}`} disabled={!date}>
                  {date?.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* 시간 선택 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center"><Clock className="mr-2" size={20} />시간 선택</h4>
            <div className="grid grid-cols-4 gap-3">
              {timeSlots.map(time => {
                const reservation = getReservationStatus(room.id, selectedDate, time);
                const hour = parseInt(time.split(':')[0], 10);
                const isLateNight = hour >= 23;

                return (
                  <button
                    key={time}
                    onClick={() => {
                      if (!agreed) return;
                      if (reservation) {
                        if (reservation.studentId === userInfo.studentId && reservation.name === userInfo.name) {
                          openCancelModal(room.id, selectedDate, time, reservation);
                        }
                      } else {
                        makeReservation(room.id, selectedDate, time);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      reservation
                        ? reservation.status === 'approved'
                          ? reservation.studentId === userInfo.studentId && reservation.name === userInfo.name
                            ? 'bg-blue-500 text-white hover:bg-blue-600 ring-2 ring-blue-300'
                            : 'bg-blue-500 text-white cursor-not-allowed'
                          : room.type === 'approval'
                          ? reservation.studentId === userInfo.studentId && reservation.name === userInfo.name
                            ? 'bg-orange-400 text-white hover:bg-orange-500 ring-2 ring-orange-300'
                            : 'bg-orange-400 text-white cursor-not-allowed'
                          : reservation.studentId === userInfo.studentId && reservation.name === userInfo.name
                          ? 'bg-yellow-400 text-white hover:bg-yellow-500 ring-2 ring-yellow-300'
                          : 'bg-yellow-400 text-white cursor-not-allowed'
                        : isLateNight || room.needsApproval
                        ? room.needsApproval
                          ? 'bg-orange-100 border-2 border-orange-400 text-orange-700 hover:bg-orange-200'
                          : 'bg-red-100 border-2 border-red-400 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 border-2 border-green-400 text-green-700 hover:bg-green-200'
                    }`}
                    disabled={!agreed || (reservation && !(reservation.studentId === userInfo.studentId && reservation.name === userInfo.name))}
                  >
                    <div>{time}</div>
                    {reservation && (
                      <div className="text-xs mt-1">
                        {reservation.status === 'approved' ? (<CheckCircle size={12} className="inline mr-1" />) : (<AlertCircle size={12} className="inline mr-1" />)}
                        {reservation.name}
                        {reservation.studentId === userInfo.studentId && reservation.name === userInfo.name && (<div className="text-xs mt-1 font-bold">클릭하여 취소</div>)}
                      </div>
                    )}
                    {!reservation && (isLateNight || room.needsApproval) && (
                      <div className="text-xs mt-1">{room.needsApproval ? '승인필요' : '23:00 이후 승인필요'}</div>
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

  // 내 예약 현황: 이름 또는 학번으로 검색(둘 중 하나만 입력해도 됨)
  const [nameQuery, setNameQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const renderMyReservations = () => {
    const mine: Array<{roomId:string; roomName:string; date: string; time: string; status: string; name: string; studentId: string}> = [];
    Object.entries(reservations).forEach(([roomId, byDate]: any) => {
      Object.entries(byDate).forEach(([dateKey, byTime]: any) => {
        Object.entries(byTime).forEach(([timeKey, value]: any) => {
          const matchesByName = nameQuery.trim() ? String(value.name).toLowerCase().includes(nameQuery.trim().toLowerCase()) : false;
          const matchesById = idQuery.trim() ? String(value.studentId).toLowerCase().includes(idQuery.trim().toLowerCase()) : false;

          if (nameQuery.trim() || idQuery.trim()) {
            if (!(matchesByName || matchesById)) return;
          } else {
            if (!(value.studentId === userInfo.studentId && value.name === userInfo.name)) return;
          }

          const roomName = rooms.find(r => r.id === roomId)?.name ?? roomId;
          mine.push({ roomId, roomName, date: dateKey, time: timeKey, status: value.status, name: value.name, studentId: value.studentId });
        });
      });
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">내 예약 현황</h2>

          {/* 검색 박스 */}
          <div className="bg-white p-4 rounded-xl shadow mb-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름으로 검색</label>
                <input type="text" placeholder="예: 김민수" className="w-full p-3 border rounded-lg" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학번으로 검색</label>
                <input type="text" placeholder="예: 20210001" className="w-full p-3 border rounded-lg" value={idQuery} onChange={(e) => setIdQuery(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">※ 둘 중 하나만 입력해도 됩니다. 둘 다 비우면 현재 입력된 학번/이름/전공 정보와 일치하는 예약만 보여요.</p>
          </div>

          {/* 사용자 기본정보 입력(검색어 없을 때만 노출) */}
          {!(nameQuery.trim() || idQuery.trim()) && (!userInfo.studentId || !userInfo.name) && (
            <div className="bg-white p-6 rounded-xl shadow mb-4">
              <p className="text-gray-700 mb-3">검색 대신, 예약 시 사용한 <b>학번/이름/세부전공</b>을 입력하세요.</p>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" placeholder="학번" className="p-3 border rounded-lg" value={userInfo.studentId} onChange={(e) => setUserInfo({ ...userInfo, studentId: e.target.value })} />
                <input type="text" placeholder="이름" className="p-3 border rounded-lg" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} />
                <input type="text" placeholder="세부전공" className="p-3 border rounded-lg" value={userInfo.major} onChange={(e) => setUserInfo({ ...userInfo, major: e.target.value })} />
              </div>
            </div>
          )}

          {mine.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow"><p className="text-gray-600">표시할 예약이 없습니다.</p></div>
          ) : (
            <div className="space-y-3">
              {mine.sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                .map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{item.roomName}</div>
                    <div className="text-lg font-semibold text-purple-700">{item.date} {item.time}</div>
                    <div className="text-xs text-gray-500">{item.status === 'approved' ? '승인됨' : '승인대기'} · 신청자 {item.name} · 학번 {item.studentId}</div>
                  </div>
                  <button
                    className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                    onClick={() => { const d = new Date(item.date); cancelReservation(item.roomId, d, item.time); }}
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 사용자 정보 입력 모달 (시간 선택 후 표시)
  const renderUserForm = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center">예약 정보 입력</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">학번</label>
            <input type="text" value={userInfo.studentId} onChange={(e) => setUserInfo({ ...userInfo, studentId: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="예: 20210001" />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="이름을 입력하세요" />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">세부전공</label>
            <input type="text" value={userInfo.major} onChange={(e) => setUserInfo({ ...userInfo, major: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="예: 실용무용전공, K-POP댄스전공, 발레전공 등" />
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button onClick={() => setShowUserForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">취소</button>
          <button
            onClick={() => {
              if (userInfo.studentId && userInfo.name && userInfo.major && selectedRoom && selectedTime) {
                const hour = parseInt(selectedTime.split(':')[0], 10);
                const isLateNight = hour >= 23;
                const room = rooms.find(r => r.id === selectedRoom);
                const needsApproval = (room?.needsApproval ?? false) || isLateNight;

                const dateKey = selectedDate.toDateString(); const timeKey = `${selectedTime}`;
                const newReservation = {
                  studentId: userInfo.studentId, name: userInfo.name, major: userInfo.major,
                  status: needsApproval ? 'pending' : 'approved', timestamp: new Date().toISOString()
                };
                setReservations((prev: any) => ({
                  ...prev,
                  [selectedRoom]: {
                    ...prev[selectedRoom as string],
                    [dateKey]: {
                      ...prev[selectedRoom as string]?.[dateKey],
                      [timeKey]: newReservation
                    }
                  }
                }));
                setShowUserForm(false);
              }
            }}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            disabled={!userInfo.studentId || !userInfo.name || !userInfo.major}
          >
            예약하기
          </button>
        </div>
      </div>
    </div>
  );

  const renderCancelModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center text-red-600">예약 취소</h3>
        {cancelTarget && (
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">다음 예약을 취소하시겠습니까?</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{rooms.find(r => r.id === cancelTarget.roomId)?.name}</p>
              <p className="text-sm text-gray-600">{formatDate(cancelTarget.date)}</p>
              <p className="text-lg font-bold text-purple-600">{cancelTarget.time}</p>
              <p className="text-sm mt-2">{cancelTarget.reservation.name} ({cancelTarget.reservation.studentId})</p>
              <p className="text-xs text-gray-500">{cancelTarget.reservation.major}</p>
            </div>
            <p className="text-red-600 text-sm mt-4">⚠️ 사용하지 않는 시간은 미리 취소해주세요</p>
          </div>
        )}
        <div className="flex space-x-3">
          <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">취소</button>
          <button
            onClick={() => {
              if (cancelTarget) {
                cancelReservation(cancelTarget.roomId, cancelTarget.date, cancelTarget.time);
                setShowCancelModal(false); setCancelTarget(null);
              }
            }}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >예약 취소</button>
        </div>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    if (currentScreen === INDEX_MAIN) return renderMainScreen();
    if (!agreed) return renderMainScreen();
    if (currentScreen === INDEX_RANKING) return renderRankingScreen();
    if (currentScreen === INDEX_MY_RESERVATIONS) return renderMyReservations();
    const idxInRooms = currentScreen - INDEX_ROOMS_START;
    const theRoom = roomScreens[idxInRooms];
    if (!theRoom) return renderMainScreen();
    return renderRoomScreen(theRoom);
  };

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
    >
      {/* 햄버거 메뉴: 아이콘은 항상 진하게, 동의 전에는 클릭만 비활성 */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => agreed && setShowMenu(!showMenu)}
          className="p-3 rounded-lg shadow-lg bg-white text-gray-900"
          aria-disabled={!agreed}
          aria-label="메뉴 열기"
          title={agreed ? '' : '동의 체크 후 이용 가능합니다'}
        >
          <Menu size={20} />
        </button>

        {showMenu && agreed && (
          <nav className="absolute top-14 left-0 bg-white rounded-xl shadow-2xl p-4 w-64 border text-gray-900 subpixel-antialiased">
            <h3 className="font-bold text-gray-800 mb-4">메뉴</h3>

            <button className="w-full text-left p-3 hover:bg-purple-50 rounded-lg text-gray-900" onClick={() => { setCurrentScreen(INDEX_MAIN); setShowMenu(false); }}>홈</button>
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
            <button className="w-full text-left p-3 hover:bg-purple-50 rounded-lg text-gray-900" onClick={() => { setCurrentScreen(INDEX_MY_RESERVATIONS); setShowMenu(false); }}>
              내 예약 현황
            </button>
          </nav>
        )}
      </div>

      {renderCurrentScreen()}

      {/* 하단 인디케이터: 동의 전에는 숨김 */}
      {agreed && currentScreen > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <button onClick={() => handleSwipe('right')} disabled={currentScreen === 0} className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50" aria-label="이전">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700">{currentScreen} / {MAX_INDEX}</span>
            <button onClick={() => handleSwipe('left')} disabled={currentScreen === MAX_INDEX} className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50" aria-label="다음">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {showUserForm && renderUserForm()}
      {showCancelModal && renderCancelModal()}
    </div>
  );
}
