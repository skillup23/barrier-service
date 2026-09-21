'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition, useCallback } from 'react';
import Link from 'next/link';

import Header from '@/components/Header';
import AdminControls from '@/components/admin/AdminControls';
import PaymentCard from '@/components/admin/PaymentCard';
import ResetPasswordForm from '@/components/admin/ResetPasswordForm';
import BarrierQueueCard from '@/components/admin/BarrierQueueCard';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const [queueData, setQueueData] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Функция загрузки очереди жителей для шлагбаума
  const fetchBarrierQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/barrier-queue');
      const data = await res.json();
      if (res.ok) setQueueData(data.summary);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Функция загрузки платежей
  const fetchAdminPayments = useCallback(async () => {
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
  }, []);

  // Проверка авторизации и роли администратора
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.['role'] !== 'admin') {
        router.push('/dashboard');
      } else {
        startTransition(() => {
          fetchAdminPayments();
          fetchBarrierQueue();
        });
      }
    }
  }, [status, session, router, fetchAdminPayments, fetchBarrierQueue]);

  // Если данные еще загружаются, показываем экран загрузки
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
        Загрузка данных модератора...
      </div>
    );
  }

  if (!session) return null;

  const user = session?.user || {};

  // Модерация чека
  const handleModerate = async (paymentId, action, rejectionReason) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          rejectionReason,
          lastPaymentDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminMsg(data.message);
        fetchAdminPayments();
        fetchBarrierQueue();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Запуск биллинга
  const handleRunBilling = async () => {
    setLoadingBilling(true);
    setAdminMsg('');
    try {
      const res = await fetch('/api/admin/cron-billing', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg(data.message);
        fetchAdminPayments();
        fetchBarrierQueue();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBilling(false);
    }
  };

  // Очистка очереди шлагбаума
  const handleClearQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch('/api/admin/barrier-queue', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg(data.message);
        fetchBarrierQueue();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
        <Header
          title="Панель Модератора"
          subtitle={`Администратор: ${user.name} | Тел: ${user.phone}`}
          extraContent={
            <Link
              href="/admin/users"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              👥 Список жителей
            </Link>
          }
        />

        {adminMsg && (
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 font-medium text-sm">
            {adminMsg}
          </div>
        )}

        <BarrierQueueCard
          queueData={queueData}
          onClearQueue={handleClearQueue}
          loading={loadingQueue}
        />

        <AdminControls
          onRunBilling={handleRunBilling}
          onDownloadCSV={() => window.open('/api/admin/export-csv', '_blank')}
          loadingBilling={loadingBilling}
        />

        {/* Очередь чеков */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Очередь чеков на проверку. Прайс&nbsp;&#8209;&nbsp;
            <span className="bg-orange-50 p-2 rounded-xl border border-orange-200">
              2,5
            </span>
            &nbsp;рубля&nbsp;в&nbsp;день
          </h2>

          {payments.length === 0 ? (
            <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
              Чеков пока нет.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {payments.slice(0, visibleCount).map((payment) => (
                  <PaymentCard
                    key={payment._id}
                    payment={payment}
                    onModerate={handleModerate}
                  />
                ))}
              </div>

              {payments.length > visibleCount && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 20)}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition"
                  >
                    Показать ещё 20 чеков (Осталось:{' '}
                    {payments.length - visibleCount})
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <ResetPasswordForm onSuccess={(msg) => setAdminMsg(msg)} />
      </div>
    </div>
  );
}
