'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Trophy, CheckCircle, AlertCircle } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // 연습실 설정
  const rooms = [
    { id: 'ranking', name: '세종연습왕 TOP10', type: 'ranking', needsApproval: false },
    { id: 'saenalC', name: '새날관 C', type: 'open', needsApproval: false },
    { id: 'saenalD', name: '새날관 D', type: 'open', needsApproval: false },
    { id: 'saenalE', name: '새날관 E', type: 'open', needsApproval: false },
    { id: 'gwangB', name: '광개토관 B', type: 'open', needsApproval: false },
    { id: 'gwangC', name: '광개토관 C', type: 'open', needsApproval: false },
    { id: 'daeyangHall', name: '대양AI 다목적홀', type: 'approval', needsApproval: true },
    { id: 'saenalB', name: '새날관 B', type: 'approval', needsApproval: true },
    { id: 'gwangA', name: '광개토관 A', type: 'approval', needsApproval: true }
  ];

  // 시간대 설정
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // TOP 10 랭킹 데이터 (예시)
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

  // 스와이프 함수
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentScreen < 8) {
      setCurrentScreen(currentScreen + 1);
    } else if (direction === 'right' && currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  // 터치 이벤트 처리
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleSwipe('left');
    if (isRightSwipe) handleSwipe('right');
  };

  // 날짜 관련 함수
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  // 예약 상태 확인
  const getReservationStatus = (roomId: string, date: Date, time: string) => {
    const dateKey = date.toDateString();
    const timeKey = `${time}`;
    return reservations[roomId]?.[dateKey]?.[timeKey] || null;
  };

  // 예약 처리
  const makeReservation = (roomId: string, date: Date, time: string) => {
    if (!userInfo.studentId || !userInfo.name || !userInfo.major) {
      setSelectedRoom(roomId);
      setSelectedTime(time);
      setShowUserForm(true);
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    const dateKey = date.toDateString();
    const timeKey = `${time}`;
    
    // 주말이나 새벽시간 체크
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const hour = parseInt(time.split(':')[0]);
    const isDawn = hour >= 23 || hour < 7;
    
    let needsApproval = room?.needsApproval || isWeekend || isDawn;
    
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

  // 예약 취소
  const cancelReservation = (roomId: string, date: Date, time: string) => {
    const dateKey = date.toDateString();
    const timeKey = `${time}`;
    
    setReservations((prev: any) => {
      const newReservations = { ...prev };
      if (newReservations[roomId] && newReservations[roomId][dateKey]) {
        delete newReservations[roomId][dateKey][timeKey];
        
        if (Object.keys(newReservations[roomId][dateKey]).length === 0) {
          delete newReservations[roomId][dateKey];
        }
        
        if (Object.keys(newReservations[roomId]).length === 0) {
          delete newReservations[roomId];
        }
      }
      return newReservations;
    });
  };

  // 취소 모달 열기
  const openCancelModal = (roomId: string, date: Date, time: string, reservation: any) => {
    setCancelTarget({ roomId, date, time, reservation });
    setShowCancelModal(true);
  };

  const renderMainScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          세종댄스스페이스
        </h1>
        <p className="text-lg text-gray-700 mb-6">실용무용과 연습실 예약 시스템</p>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 사용 방법 및 주의사항</h3>
          <div className="text-sm text-gray-600 text-left space-y-2">
            <p>• 학번, 이름, 세부전공을 정확히 입력해주세요</p>
            <p>• 예약 시간을 준수해주세요</p>
            <p>• 사용 후 반드시 청소해주세요</p>
            <p>• 시설 파손 시 즉시 신고해주세요</p>
            <p>• 새벽시간(23:00~07:00)과 주말은 승인이 필요합니다</p>
            <p className="text-red-600 font-medium">• ⚠️ 노쇼는 다음 연습실 사용에 제약이 있을 수 있습니다</p>
            <p className="text-red-600 font-medium">• ⚠️ 연습실 사용을 안할 경우, 반드시 캔슬바랍니다</p>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mr-3 w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="agreement" className="text-sm text-gray-700">
              위 내용을 확인했으며, 시설 파손 및 청소에 대한 책임을 동의합니다
            </label>
          </div>
        </div>

        {agreed && (
          <>
            <button
              onClick={() => setCurrentScreen(1)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 mb-4"
            >
              <Trophy className="inline mr-2" size={20} />
              세종연습왕 TOP10 보기
            </button>
            
            <div className="animate-pulse text-purple-500 opacity-70 flex items-center justify-center">
              <span className="mr-2">오른쪽으로 스와이프하세요</span>
              <ChevronRight className="animate-bounce" size={20} />
            </div>
          </>
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
            <div
              key={user.rank}
              className={`bg-white rounded-xl p-4 shadow-md flex items-center ${
                index < 3 ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${
                index === 0 ? 'bg-yellow-500 text-white' :
                index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-purple-100 text-purple-800'
              }`}>
                {user.rank}
              </div>
              
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
              
              {index < 3 && (
                <Trophy className={`ml-2 ${
                  index === 0 ? 'text-yellow-500' :
                  index === 1 ? 'text-gray-400' :
                  'text-amber-600'
                }`} size={24} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoomScreen = (room: any) => (
    <div className={`min-h-screen p-4 ${
      room.type === 'approval' 
        ? 'bg-gradient-to-br from-orange-50 to-red-50' 
        : 'bg-gradient-to-br from-blue-50 to-purple-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${
          room.type === 'approval' 
            ? 'bg-white border-2 border-orange-200' 
            : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${
                room.type === 'approval' ? 'text-orange-800' : 'text-gray-800'
              }`}>{room.name}</h2>
              <p className="text-sm text-gray-600 flex items-center">
                {room.needsApproval ? (
                  <>
                    <AlertCircle className="mr-1 text-orange-500" size={16} />
                    승인 필요
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-1 text-green-500" size={16} />
                    즉시 사용 가능
                  </>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{formatDate(selectedDate)}</p>
            </div>
          </div>

          {/* 캘린더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h3>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(selectedDate).map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  className={`p-2 text-sm rounded-lg ${
                    !date ? 'invisible' :
                    date.toDateString() === selectedDate.toDateString() 
                      ? 'bg-purple-500 text-white' 
                      : 'hover:bg-purple-100 text-gray-700'
                  }`}
                  disabled={!date}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* 시간대 선택 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              시간 선택
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {timeSlots.map(time => {
                const reservation = getReservationStatus(room.id, selectedDate, time);
                const hour = parseInt(time.split(':')[0]);
                const isDawn = hour >= 23 || hour < 7;
                const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
                const needsSpecialApproval = isDawn || isWeekend;

                return (
                  <button
                    key={time}
                    onClick={() => {
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
                            ? 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600 ring-2 ring-blue-300'
                            : 'bg-blue-500 text-white cursor-not-allowed'
                          : room.type === 'approval'
                          ? reservation.studentId === userInfo.studentId && reservation.name === userInfo.name
                            ? 'bg-orange-400 text-white cursor-pointer hover:bg-orange-500 ring-2 ring-orange-300'
                            : 'bg-orange-400 text-white cursor-not-allowed'
                          : reservation.studentId === userInfo.studentId && reservation.name === userInfo.name
                          ? 'bg-yellow-400 text-white cursor-pointer hover:bg-yellow-500 ring-2 ring-yellow-300'
                          : 'bg-yellow-400 text-white cursor-not-allowed'
                        : needsSpecialApproval
                        ? room.type === 'approval'
                          ? 'bg-red-100 border-2 border-red-400 text-red-700 hover:bg-red-200'
                          : 'bg-orange-100 border-2 border-orange-400 text-orange-700 hover:bg-orange-200'
                        : room.type === 'approval'
                        ? 'bg-orange-100 border-2 border-orange-400 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 border-2 border-green-400 text-green-700 hover:bg-green-200'
                    }`}
                    disabled={reservation && !(reservation.studentId === userInfo.studentId && reservation.name === userInfo.name)}
                  >
                    <div>{time}</div>
                    {reservation && (
                      <div className="text-xs mt-1">
                        {reservation.status === 'approved' ? (
                          <CheckCircle size={12} className="inline mr-1" />
                        ) : (
                          <AlertCircle size={12} className="inline mr-1" />
                        )}
                        {reservation.name}
                        {reservation.studentId === userInfo.studentId && reservation.name === userInfo.name && (
                          <div className="text-xs mt-1 font-bold">클릭하여 취소</div>
                        )}
                      </div>
                    )}
                    {!reservation && (needsSpecialApproval || room.type === 'approval') && (
                      <div className="text-xs mt-1">
                        {needsSpecialApproval ? '새벽연습(승인필요)' : '승인필요'}
                      </div>
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

  const renderUserForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center">예약 정보 입력</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">학번</label>
            <input
              type="text"
              value={userInfo.studentId}
              onChange={(e) => setUserInfo({...userInfo, studentId: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="예: 20210001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input
              type="text"
              value={userInfo.name}
              onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="이름을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">세부전공</label>
            <input
              type="text"
              value={userInfo.major}
              onChange={(e) => setUserInfo({...userInfo, major: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="예: 실용무용전공, K-POP댄스전공, 발레전공 등"
            />
          </div>
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowUserForm(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (userInfo.studentId && userInfo.name && userInfo.major && selectedRoom && selectedTime) {
                makeReservation(selectedRoom, selectedDate, selectedTime);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center text-red-600">예약 취소</h3>
        {cancelTarget && (
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">다음 예약을 취소하시겠습니까?</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{rooms.find(r => r.id === cancelTarget.roomId)?.name}</p>
              <p className="text-sm text-gray-600">{formatDate(cancelTarget.date)}</p>
              <p className="text-lg font-bold text-purple-600">{cancelTarget.time}</p>
              <p className="text-sm mt-2">
                {cancelTarget.reservation.name} ({cancelTarget.reservation.studentId})
              </p>
              <p className="text-xs text-gray-500">{cancelTarget.reservation.major}</p>
            </div>
            <p className="text-red-600 text-sm mt-4">
              ⚠️ 다른 학생들을 위해 사용하지 않는 시간은 미리 취소해주세요
            </p>
          </div>
        )}
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCancelModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (cancelTarget) {
                cancelReservation(cancelTarget.roomId, cancelTarget.date, cancelTarget.time);
                setShowCancelModal(false);
                setCancelTarget(null);
              }
            }}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            예약 취소
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    if (currentScreen === 0) return renderMainScreen();
    if (currentScreen === 1) return renderRankingScreen();
    const roomIndex = currentScreen - 1;
    return renderRoomScreen(rooms[roomIndex]);
  };

  return (
    <div 
      className="relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
    >
      {renderCurrentScreen()}
      
      {/* 네비게이션 인디케이터 */}
      {currentScreen > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSwipe('right')}
              disabled={currentScreen === 0}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {currentScreen} / 8
            </span>
            <button
              onClick={() => handleSwipe('left')}
              disabled={currentScreen === 8}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
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