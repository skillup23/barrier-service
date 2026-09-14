'use client';

import { signOut } from 'next-auth/react';

export default function Header({ title, subtitle, extraContent }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {extraContent}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
