'use client';

import { useState } from 'react';

export default function PaymentCard({ payment, onModerate }) {
  const [rejectReason, setRejectReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const handleAction = async (action) => {
    setLoadingAction(true);
    await onModerate(payment._id, action, rejectReason);
    setLoadingAction(false);
  };

  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    pending: 'Ожидает',
    approved: 'Принят',
    rejected: 'Отклонен',
  };

  const residentName =
    [
      payment.userId?.fullName?.lastName,
      payment.userId?.fullName?.firstName,
      payment.userId?.fullName?.middleName,
    ]
      .filter(Boolean)
      .join(' ') || 'ФИО не указано';

  const residentAddress =
    [
      payment.userId?.address?.area,
      payment.userId?.address?.street
        ? `ул. ${payment.userId.address.street}`
        : '',
      payment.userId?.address?.house
        ? `д. ${payment.userId.address.house}`
        : '',
    ]
      .filter(Boolean)
      .join(', ') || 'Адрес не указан';

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusStyles[payment.status] || 'bg-gray-100'}`}
          >
            {statusLabels[payment.status] || payment.status}
          </span>
          {payment.isEntranceFee && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
              Первичный взнос
            </span>
          )}
        </div>

        <p className="font-bold text-gray-800 text-lg mt-1">
          {payment.amount} ₽
        </p>

        <p className="text-sm text-gray-600">
          Житель:{' '}
          <span className="font-medium text-gray-800">{residentName}</span> (
          {payment.userId?.phone})
        </p>

        <p className="text-xs text-gray-500">📍 {residentAddress}</p>

        <p className="text-xs text-gray-400">
          Загружен: {new Date(payment.createdAt).toLocaleString('ru-RU')}
        </p>

        {payment.rejectionReason && (
          <p className="text-xs text-red-600 font-medium">
            Причина отказа: {payment.rejectionReason}
          </p>
        )}

        <a
          href={payment.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-sm text-blue-600 hover:underline font-medium"
        >
          📄 Открыть PDF-чек в S3
        </a>
      </div>

      {payment.status === 'pending' && (
        <div className="flex flex-col gap-2 min-w-[220px] justify-center">
          <button
            onClick={() => handleAction('approved')}
            disabled={loadingAction}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            ✓ Принять платёж
          </button>

          <input
            type="text"
            placeholder="Причина отказа"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={loadingAction}
            className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
          />

          <button
            onClick={() => handleAction('rejected')}
            disabled={loadingAction}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            ✕ Отклонить
          </button>
        </div>
      )}
    </div>
  );
}
