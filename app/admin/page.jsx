'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const [resetPhone, setResetPhone] = useState('');
  const [newPass, setNewPass] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Функция загрузки платежей
  const fetchAdminPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.['role'];
      if (userRole !== 'admin') {
        router.push('/dashboard');
      } else {
        // startTransition сообщает React, что это обновление состояния не блокирует рендер
        startTransition(() => {
          fetchAdminPayments();
        });
      }
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
        Загрузка данных модератора...
      </div>
    );
  }

  if (!session) return null;

  const user = session?.user || {};

  // Модерация чека (Принять / Отклонить)
  const handleModerate = async (paymentId, action) => {
    try {
      const reason = rejectReason[paymentId] || '';
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          rejectionReason: reason,
          lastPaymentDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminMsg(data.message);
        fetchAdminPayments();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Сброс пароля жильцу/модератору
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAdminMsg('');
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPhone: resetPhone, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg(data.message);
        setResetPhone('');
        setNewPass('');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Запуск скрипта биллинга (пересчитать долги и перевести в Grace/Disabled)
  const handleRunBilling = async () => {
    try {
      const res = await fetch('/api/admin/cron-billing', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg(data.message);
        fetchAdminPayments();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Скачивание CSV
  const handleDownloadCSV = () => {
    window.open('/api/admin/export-csv', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 border-b gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Панель Модератора
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Администратор: {user.name} | Тел:{' '}
              <span className="font-medium text-gray-700">{user.phone}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/users"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              👥 Список жителей
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition font-medium"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {adminMsg && (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 font-medium text-sm">
              {adminMsg}
            </div>
          )}

          {/* Блок быстрого управления и выгрузки CSV */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-blue-900 text-base">
                Инструменты шлагбаума
              </h3>
              <p className="text-xs text-blue-700">
                Выгрузка активных номеров и запуск проверки задолженностей.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRunBilling}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                ⚡ Пересчитать долги (Grace/Disabled)
              </button>
              <button
                onClick={handleDownloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                📥 Скачать CSV для шлагбаума
              </button>
            </div>
          </div>

          {/* Очередь чеков */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Очередь чеков на проверку
            </h2>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                Чеков пока нет.
              </p>
            ) : (
              <div className="space-y-4">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            p.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : p.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status === 'pending'
                            ? 'Ожидает'
                            : p.status === 'approved'
                              ? 'Принят'
                              : 'Отклонен'}
                        </span>
                        {p.isEntranceFee && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            Первичный взнос
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-800 text-lg mt-1">
                        {p.amount} ₽
                      </p>
                      <p className="text-sm text-gray-600">
                        Житель:{' '}
                        <span className="font-medium text-gray-800">
                          {p.userId?.fullName?.lastName}{' '}
                          {p.userId?.fullName?.firstName}
                        </span>{' '}
                        ({p.userId?.phone})
                      </p>
                      <p className="text-xs text-gray-500">
                        Адрес: {p.userId?.address?.area}, ул.{' '}
                        {p.userId?.address?.street}, д.{' '}
                        {p.userId?.address?.house}
                      </p>
                      <p className="text-xs text-gray-400">
                        Загружен:{' '}
                        {new Date(p.createdAt).toLocaleString('ru-RU')}
                      </p>
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-sm text-blue-600 hover:underline font-medium"
                      >
                        📄 Открыть PDF-чек в S3
                      </a>
                    </div>

                    {p.status === 'pending' && (
                      <div className="flex flex-col gap-2 min-w-55 justify-center">
                        <button
                          onClick={() => handleModerate(p._id, 'approved')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition"
                        >
                          ✓ Принять платёж
                        </button>

                        <input
                          type="text"
                          placeholder="Причина отказа"
                          value={rejectReason[p._id] || ''}
                          onChange={(e) =>
                            setRejectReason({
                              ...rejectReason,
                              [p._id]: e.target.value,
                            })
                          }
                          className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
                        />
                        <button
                          onClick={() => handleModerate(p._id, 'rejected')}
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition"
                        >
                          ✕ Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Форма сброса паролей */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Сбросить пароль жителю / себе
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Укажите номер телефона аккаунта и новый пароль.
            </p>
            <form
              onSubmit={handleResetPassword}
              className="flex flex-col md:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="Номер телефона (+79991112233)"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition whitespace-nowrap"
              >
                Сменить пароль
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
