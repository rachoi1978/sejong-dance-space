cat > app/page.tsx << 'EOF'
'use client';

import React, { useState, useRef } from 'react';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const renderHamburgerMenu = () => (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-white bg-opacity-90 p-3 rounded-lg shadow-lg hover:bg-opacity-100 transition-all"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <div className="w-full h-0.5 bg-gray-800"></div>
          <div className="w-full h-0.5 bg-gray-800"></div>
          <div className="w-full h-0.5 bg-gray-800"></div>
        </div>
      </button>

      {showMenu && (
        <div className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-4 w-64 border">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">메뉴</h3>
          <button
            onClick={() => {
              setCurrentScreen(0);
              setShowMenu(false);
            }}
            className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors mb-2"
          >
            메인 화면
          </button>
          <button
            onClick={() => {
              setCurrentScreen(1);
              setShowMenu(false);
            }}
            className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors"
          >
            랭킹 보기
          </button>
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
        
        {!agreed ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">사용 방법 및 주의사항</h3>
            <div className="text-sm text-gray-600 text-left space-y-2">
              <p>• 노쇼는 다음 연습실 사용에 제약이 있을 수 있습니다</p>
              <p>• 연습실 사용을 안할 경우, 반드시 캔슬바랍니다</p>
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
                위 내용을 확인했으며 동의합니다
              </label>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCurrentScreen(1)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
          >
            시작하기
          </button>
        )}
      </div>
    </div>
  );

  const renderScreen = () => {
    if (currentScreen === 0) return renderMainScreen();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">연습실 예약 시스템</h2>
          <p className="text-gray-600 mb-4">햄버거 메뉴가 정상 작동합니다!</p>
          <button
            onClick={() => setCurrentScreen(0)}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            메인으로
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden">
      {renderHamburgerMenu()}
      {renderScreen()}
    </div>
  );
}
EOF