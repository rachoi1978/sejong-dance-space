'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* 햄버거 메뉴 */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-white/90 p-3 rounded-lg shadow-lg"
          aria-label="메뉴 열기"
        >
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <div className="w-full h-0.5 bg-gray-800"></div>
            <div className="w-full h-0.5 bg-gray-800"></div>
            <div className="w-full h-0.5 bg-gray-800"></div>
          </div>
        </button>

        {showMenu && (
          <nav className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-4 w-64 border">
            <h3 className="font-bold text-gray-800 mb-4">메뉴</h3>
            <Link href="/" className="block w-full text-left p-3 hover:bg-purple-50 rounded-lg" onClick={() => setShowMenu(false)}>
              홈
            </Link>
            <Link href="/available-now" className="block w-full text-left p-3 hover:bg-purple-50 rounded-lg" onClick={() => setShowMenu(false)}>
              즉시 사용 가능
            </Link>
            <Link href="/needs-approval" className="block w-full text-left p-3 hover:bg-purple-50 rounded-lg" onClick={() => setShowMenu(false)}>
              승인 필요
            </Link>
            <Link href="/reservations" className="block w-full text-left p-3 hover:bg-purple-50 rounded-lg" onClick={() => setShowMenu(false)}>
              내 예약 현황
            </Link>
          </nav>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 p-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          세종댄스스페이스
        </h1>
        <p className="text-lg text-gray-700 mb-6">실용무용과 연습실 예약 시스템</p>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">사용 안내</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>노쇼는 다음 연습실 사용에 제약이 있을 수 있습니다</li>
            <li>연습실 사용을 안할 경우, 반드시 캔슬 바랍니다</li>
          </ul>

          <label className="mt-4 flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4"
            />
            동의합니다
          </label>
        </div>

        {agreed ? (
          <Link href="/available-now" className="bg-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold">
            시작하기
          </Link>
        ) : (
          <button disabled className="bg-gray-300 text-white px-8 py-3 rounded-full text-lg font-semibold cursor-not-allowed" title="동의 후 시작할 수 있습니다">
            시작하기
          </button>
        )}
      </div>
    </div>
  );
}
