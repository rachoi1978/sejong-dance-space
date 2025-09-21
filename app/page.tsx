'use client';

import React, { useState, useRef } from 'react';

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

  // TOP 10 랭킹 데이터
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

  // 메뉴 카테고리
  const menuCategories = [
    { id: 'instant', name: '즉시 사용 가능', rooms: ['saenalC', 'saenalD', 'saenalE', 'gwangB', 'gwangC'] },
    { id: 'approval', name: '승인 필요', rooms: ['daeyangHall', 'saenalB', 'gwangA'] },
    { id: 'my-reservations', name: '내 예약 현황', rooms: [] }
  ];

  // 햄버거 메뉴 렌더링
  const renderHamburgerMenu = () => (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-white bg-opacity-90 p-3 rounded-lg shadow-lg hover:bg-opacity-100 transition-all"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <div className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${showMenu ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${showMenu ? 'opacity-0' : ''}`}></div>
          <div className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${showMenu ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {showMenu && (
        <div className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-4 w-64 border">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">카테고리</h3>
          
          {menuCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setShowMenu(false);
                if (category.id === 'my-reservations') {
                  setCurrentScreen(-1);
                } else if (category.id === 'instant') {
                  setCurrentScreen(2); // 새날관 C
                } else if (category.id === 'approval') {
                  setCurrentScreen(7); // 대양AI 다목적홀
                }
              }}
              className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors mb-2 flex items-center justify-between"
            >
              <span className="font-medium text-gray-700">{category.name}</span>
              <span className="text-purple-500">→</span>
            </button>
          ))}
          
          <div className="border-t pt-3 mt-3">
            <button
              onClick={() => {
                setCurrentScreen(0);
                setShowMenu(false);
              }}
              className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-medium"
            >
              메인 화면으로
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
              🏆 세종연습왕 TOP10 보기
            </button>
            
            <div className="animate-pulse text-purple-500 opacity-70 flex items-center justify-center">
              <span className="mr-2">왼쪽 상단 메뉴를 클릭하세요</span>
              <span className="text-2xl animate-bounce">☰</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderRankingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏆</div>
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
                <span className={`ml-2 text-2xl ${
                  index === 0 ? 'text-yellow-500' :
                  index === 1 ? 'text-gray-400' :
                  'text-amber-600'
                }`}>🏆</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    if (currentScreen === 0) return renderMainScreen();
    if (currentScreen === 1) return renderRankingScreen();
    if (currentScreen === -1) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">내 예약 현황</h2>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <p className="text-gray-600 mb-4">예약 기능을 사용하시면 여기에 표시됩니다.</p>
                <button
                  onClick={() => setCurrentScreen(2)}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600"
                >
                  연습실 예약하기
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">연습실 예약 시스템</h2>
          <p className="text-gray-600 mb-4">연습실 예약 기능이 곧 추가됩니다!</p>
          <p className="text-sm text-gray-500 mb-6">현재는 햄버거 메뉴와 기본 화면 전환만 가능합니다.</p>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentScreen(0)}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              메인으로
            </button>
            <button
              onClick={() => setCurrentScreen(1)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              랭킹 보기
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {renderHamburgerMenu()}
      {renderCurrentScreen()}
    </div>
  );
}
