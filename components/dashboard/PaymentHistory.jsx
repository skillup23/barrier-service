'use client';

export default function PaymentHistory({ payments = [] }) {
  if (!payments || payments.length === 0) {
    return null;
  }

  const statusConfig = {
    pending: {
      label: 'На проверке',
      badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    approved: {
      label: 'Принят',
      badgeClass: 'bg-green-100 text-green-800 border-green-200',
    },
    rejected: {
      label: 'Отклонён',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">
        История ваших платежей
      </h2>

      <div className="space-y-3">
        {payments.map((p) => {
          const config = statusConfig[p.status] || {
            label: p.status,
            badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
          };

          return (
            <div
              key={p._id}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-base">
                    {p.amount} ₽
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                  {p.isEntranceFee && (
                    <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2 py-0.5 rounded-full font-medium">
                      Вступительный взнос
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Дата отправки:{' '}
                  {new Date(p.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {/* Показ причины отказа при статусе rejected */}
                {p.status === 'rejected' && (
                  <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <span className="font-bold">Причина отказа: </span>
                    {p.rejectionReason ||
                      'Чек не прошел модерацию. Проверьте реквизиты или сумму.'}
                  </div>
                )}
              </div>

              {p.receiptUrl && (
                <div className="sm:text-right">
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 font-medium"
                  >
                    📄 Посмотреть чек
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
