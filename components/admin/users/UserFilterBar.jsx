'use client';

export default function UserFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onToggleSort,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input
        type="text"
        placeholder="Поиск по ФИО, телефону или адресу..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
      />

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
      >
        <option value="all">Все статусы</option>
        <option value="active">Только Активные</option>
        <option value="grace">Только Требует оплаты</option>
        <option value="disabled">Только Заблокированные</option>
        <option value="frozen">Только Замороженные</option>
      </select>

      <button
        onClick={onToggleSort}
        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition flex items-center justify-center gap-2"
      >
        📅 Оплачен до:{' '}
        {sortOrder === 'desc'
          ? 'Сначала дальние ↓'
          : 'Сначала близкие/должники ↑'}
      </button>
    </div>
  );
}
