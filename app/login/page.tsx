'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const LS_USER = 'sds_userInfo_v4';
  const canLogin = name.trim().length > 0 && studentId.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 p-6 text-gray-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-2">로그인</h1>
        <p className="text-center text-gray-600 mb-6">이름과 학번만 입력하면 됩니다.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">이름</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400"
              placeholder="예: 김민수"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">학번</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg text-gray-900 placeholder-gray-400"
              placeholder="예: 20210001"
              value={studentId}
              onChange={(e)=>setStudentId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={()=>router.push('/')}
            className="flex-1 px-4 py-2 border rounded-lg"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canLogin}
            onClick={()=>{
              if (!canLogin) return;
              try {
                localStorage.setItem(LS_USER, JSON.stringify({ name: name.trim(), studentId: studentId.trim() }));
              } catch {}
              router.push('/?screen=ranking');
            }}
            className={`flex-1 px-4 py-2 rounded-lg ${canLogin ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
