'use client';

export default function AdminControls({
  onRunBilling,
  onDownloadCSV,
  loadingBilling,
}) {
  return (
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
          onClick={onRunBilling}
          disabled={loadingBilling}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loadingBilling
            ? 'Проверка...'
            : '⚡ Пересчитать долги (Grace/Disabled)'}
        </button>
        <button
          onClick={onDownloadCSV}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition"
        >
          📥 Скачать CSV для шлагбаума
        </button>
      </div>
    </div>
  );
}
