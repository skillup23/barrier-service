// карточка баланса, дней и статуса (с бейджем)
import StatusBadge from '@/components/StatusBadge';

export default function ResidentStatusCard({
  status,
  paidUntil,
  days,
  dateStr,
}) {
  const isExpired = status === 'disabled';

  return (
    <div
      className={`p-6 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        status === 'disabled'
          ? 'bg-red-50 border-red-200'
          : status === 'grace'
            ? 'bg-amber-50 border-amber-200'
            : status === 'frozen'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
      }`}
    >
      <div>
        <div className="mb-2">
          <StatusBadge status={status} />
        </div>
        <p
          className={`text-base font-semibold ${
            status === 'disabled'
              ? 'text-red-900'
              : status === 'grace'
                ? 'text-amber-900'
                : status === 'frozen'
                  ? 'text-blue-900'
                  : 'text-green-900'
          }`}
        >
          {status === 'disabled'
            ? `Проезд заблокирован. Оплата истекла: ${dateStr}`
            : status === 'grace'
              ? `Срок оплаты истек (${dateStr}). Пожалуйста, внесите платеж.`
              : status === 'frozen'
                ? 'Действие услуги временно приостановлено (заморозка).'
                : `Оплачено до: ${dateStr}`}
        </p>
      </div>

      <div className="text-left md:text-right">
        <p className="text-xs text-gray-500 uppercase font-semibold">
          {status === 'active' ? 'Осталось дней' : 'Дней просрочки'}
        </p>
        <p
          className={`text-3xl font-extrabold ${
            status === 'disabled'
              ? 'text-red-600'
              : status === 'grace'
                ? 'text-amber-600'
                : status === 'frozen'
                  ? 'text-blue-600'
                  : 'text-green-700'
          }`}
        >
          {days}
        </p>
      </div>
    </div>
  );
}
