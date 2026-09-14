export default function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    grace: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    disabled: 'bg-red-100 text-red-800 border-red-200',
    frozen: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const labels = {
    active: 'Активен',
    grace: 'Требует оплаты',
    disabled: 'Заблокирован',
    frozen: 'Заморожен',
  };

  const currentStyle =
    styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  const currentLabel = labels[status] || status || 'Неизвестно';

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${currentStyle}`}
    >
      {currentLabel}
    </span>
  );
}
