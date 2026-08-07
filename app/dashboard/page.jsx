'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition, useCallback } from 'react';

export default function ResidentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [isEntranceFee, setIsEntranceFee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Загрузка актуального профиля из MongoDB
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (res.ok) {
        setUserData(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      startTransition(() => {
        fetchUserProfile();
      });
    }
  }, [status, router, fetchUserProfile]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
        Загрузка...
      </div>
    );
  }

  if (!session) return null;

  const sessionUser = session?.user || {};
  const currentUser = userData || {};

  // Расчет оставшихся дней и форматирование даты
  const calculateDaysLeft = (paidUntilDate) => {
    if (!paidUntilDate)
      return { days: 0, dateStr: 'Нет данных', isExpired: true };

    const target = new Date(paidUntilDate);
    const now = new Date();
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateStr = target.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      days: diffDays > 0 ? diffDays : 0,
      dateStr,
      isExpired: diffDays <= 0,
    };
  };

  const { days, dateStr, isExpired } = calculateDaysLeft(currentUser.paidUntil);

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!file || !amount) {
      setError('Выберите файл чека и укажите сумму');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('amount', amount);
    formData.append('isEntranceFee', isEntranceFee);

    try {
      const res = await fetch('/api/payments/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при загрузке');

      setMessage(data.message);
      setFile(null);
      setAmount('');
      setIsEntranceFee(false);
      const inputEl = document.getElementById('receiptInput');
      if (inputEl) inputEl.value = '';

      fetchUserProfile(); // Обновляем профиль
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 border-b gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Личный Кабинет Жителя
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {sessionUser.name} | Тел:{' '}
              <span className="font-medium text-gray-700">
                {sessionUser.phone}
              </span>
            </p>
            {currentUser.address && (
              <p className="text-xs text-gray-400 mt-0.5">
                Адрес: {currentUser.address.area}, ул.{' '}
                {currentUser.address.street}, д. {currentUser.address.house}
              </p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition font-medium"
          >
            Выйти
          </button>
        </div>

        {/* Информационный карточка Баланса и Статуса */}
        <div className="space-y-6">
          <div
            className={`p-6 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              isExpired
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div>
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider mb-2 ${
                  isExpired
                    ? 'bg-red-200 text-red-800'
                    : 'bg-green-200 text-green-800'
                }`}
              >
                {isExpired
                  ? 'Статус: Требуется оплата'
                  : 'Статус: Проезд разрешен'}
              </span>
              <p
                className={`text-base font-semibold ${isExpired ? 'text-red-900' : 'text-green-900'}`}
              >
                Оплачено до: <span className="underline">{dateStr}</span>
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Осталось дней
              </p>
              <p
                className={`text-3xl font-extrabold ${isExpired ? 'text-red-600' : 'text-green-700'}`}
              >
                {days}{' '}
                {days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней'}
              </p>
            </div>
          </div>

          {/* Форма загрузки чека */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Загрузить новый платёж (чек)
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm border border-green-200">
                {message}
              </div>
            )}

            <form onSubmit={handleUploadPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма платежа (₽)
                </label>
                <input
                  type="number"
                  placeholder="75 или 700"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Файл чека (PDF, JPG, PNG)
                </label>
                <input
                  id="receiptInput"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="w-full text-sm text-gray-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="entranceFee"
                  checked={isEntranceFee}
                  onChange={(e) => setIsEntranceFee(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label
                  htmlFor="entranceFee"
                  className="text-sm text-gray-700 select-none"
                >
                  Включает вступительный взнос (700 ₽ за первые 2 номера)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Отправка...' : 'Отправить чек модератору'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
