'use client';

import { useState } from 'react';

export default function ResetPasswordForm({ onSuccess }) {
  const [targetPhone, setTargetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPhone, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onSuccess) onSuccess(data.message);
        setTargetPhone('');
        setNewPassword('');
      } else {
        alert(data.error || 'Ошибка сброса пароля');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
      <h2 className="text-lg font-bold text-gray-800 mb-2">
        Сбросить пароль жителю
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Укажите номер телефона аккаунта и новый пароль (минимум 6 символов).
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Номер телефона (+79991112233)"
          value={targetPhone}
          onChange={(e) => setTargetPhone(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
        />
        <input
          type="password"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition whitespace-nowrap disabled:opacity-50"
        >
          {loading ? 'Смена...' : 'Сменить пароль'}
        </button>
      </form>
    </div>
  );
}
