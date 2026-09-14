'use client';

import StatusBadge from '@/components/StatusBadge';

export default function UserTableRow({ user, onEdit }) {
  const residentName =
    [
      user.fullName?.lastName,
      user.fullName?.firstName,
      user.fullName?.middleName,
    ]
      .filter(Boolean)
      .join(' ') || 'ФИО не указано';

  const residentAddress =
    [
      user.address?.area,
      user.address?.street ? `ул. ${user.address.street}` : '',
      user.address?.house ? `д. ${user.address.house}` : '',
    ]
      .filter(Boolean)
      .join(', ') || 'Адрес не указан';

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="p-3 font-medium text-gray-900 whitespace-nowrap">
        {user.phone}
      </td>
      <td className="p-3 text-gray-800">{residentName}</td>
      <td className="p-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="p-3 whitespace-nowrap text-gray-600">
        {user.paidUntil
          ? new Date(user.paidUntil).toLocaleDateString('ru-RU')
          : '—'}
      </td>
      <td className="p-3 text-xs text-gray-600">
        {user.phones?.[0]?.carModel}{' '}
        <span className="font-semibold">{user.phones?.[0]?.carPlate}</span>
      </td>
      <td className="p-3 text-xs text-gray-600">{residentAddress}</td>
      <td className="p-3 text-right">
        <button
          onClick={() => onEdit(user)}
          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium transition"
        >
          ✎ Изменить
        </button>
      </td>
    </tr>
  );
}
