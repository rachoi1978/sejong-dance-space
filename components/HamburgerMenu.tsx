'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed top-4 left-4 z-50">
      <button onClick={() => setOpen(o => !o)} className="bg-white/90 p-3 rounded-lg shadow-lg" aria-label="메뉴 열기">
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <div className="w-full h-0.5 bg-gray-800" />
          <div className="w-full h-0.5 bg-gray-800" />
          <div className="w-full h-0.5 bg-gray-800" />
        </div>
      </button>
      {open && (
        <nav className="absolute top-16 left-0 bg-white rounded-xl shadow-2xl p-4 w-64 border">
          <h3 className="font-bold text-gray-800 mb-4">메뉴</h3>
          <Link href="/" className="block p-3 hover:bg-purple-50 rounded-lg" onClick={() => setOpen(false)}>홈</Link>
          <Link href="/available-now" className="block p-3 hover:bg-purple-50 rounded-lg" onClick={() => setOpen(false)}>즉시 사용 가능</Link>
          <Link href="/needs-approval" className="block p-3 hover:bg-purple-50 rounded-lg" onClick={() => setOpen(false)}>승인 필요</Link>
          <Link href="/reservations" className="block p-3 hover:bg-purple-50 rounded-lg" onClick={() => setOpen(false)}>내 예약 현황</Link>
        </nav>
      )}
    </div>
  );
}
