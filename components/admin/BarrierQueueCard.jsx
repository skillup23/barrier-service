'use client';

import { useState } from 'react';

export default function BarrierQueueCard({ queueData, onClearQueue, loading }) {
  const [copiedType, setCopiedType] = useState(null);

  if (!queueData || queueData.totalPending === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-base">
            Очередь SMS для шлагбаума
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Все изменения синхронизированы. Новых номеров для отправки нет.
          </p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
          Актуально ✓
        </span>
      </div>
    );
  }

  const { toAdd, toRemove, addPhonesString, removePhonesString, totalPending } =
    queueData;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-base">
              Очередь изменений для шлагбаума
            </h3>
            <span className="bg-amber-200 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {totalPending} шт.
            </span>
          </div>
          <p className="text-xs text-amber-900/80 mt-0.5">
            Номера, сменившие статус. Скопируйте для отправки команды по СМС в
            шлагбаум.
          </p>
        </div>

        <button
          onClick={onClearQueue}
          disabled={loading}
          className="bg-gray-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Сохранение...' : '✓ Отметить как отправленные'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Блок добавления */}
        <div className="bg-white p-4 rounded-xl border border-green-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 flex items-center gap-1.5">
              🟢 Добавить в шлагбаум ({toAdd.length})
            </span>
            {toAdd.length > 0 && (
              <button
                onClick={() => handleCopy(addPhonesString, 'add')}
                className="text-xs text-green-700 hover:text-green-900 bg-green-50 px-2 py-1 rounded font-medium transition"
              >
                {copiedType === 'add' ? '✓ Скопировано!' : 'Копировать номера'}
              </button>
            )}
          </div>

          {toAdd.length === 0 ? (
            <p className="text-xs text-gray-400">Нет номеров на добавление</p>
          ) : (
            <>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs font-mono break-all text-gray-800 select-all">
                {addPhonesString}
              </div>
              <ul className="text-xs text-gray-500 space-y-1 max-h-28 overflow-y-auto pt-1">
                {toAdd.map((item) => (
                  <li key={item._id} className="flex justify-between">
                    <span>
                      {item.userName || 'Житель'} ({item.phone})
                    </span>
                    <span className="text-gray-400">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Блок удаления */}
        <div className="bg-white p-4 rounded-xl border border-red-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              🔴 Удалить из шлагбаума ({toRemove.length})
            </span>
            {toRemove.length > 0 && (
              <button
                onClick={() => handleCopy(removePhonesString, 'remove')}
                className="text-xs text-red-700 hover:text-red-900 bg-red-50 px-2 py-1 rounded font-medium transition"
              >
                {copiedType === 'remove'
                  ? '✓ Скопировано!'
                  : 'Копировать номера'}
              </button>
            )}
          </div>

          {toRemove.length === 0 ? (
            <p className="text-xs text-gray-400">Нет номеров на удаление</p>
          ) : (
            <>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs font-mono break-all text-gray-800 select-all">
                {removePhonesString}
              </div>
              <ul className="text-xs text-gray-500 space-y-1 max-h-28 overflow-y-auto pt-1">
                {toRemove.map((item) => (
                  <li key={item._id} className="flex justify-between">
                    <span>
                      {item.userName || 'Житель'} ({item.phone})
                    </span>
                    <span className="text-gray-400">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
