'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition, useCallback } from 'react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.['role'] !== 'admin') {
        router.push('/dashboard');
      } else {
        startTransition(() => {
          fetchUsers();
        });
      }
    }
  }, [status, session, router, fetchUsers]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
        Загрузка...
      </div>
    );
  }

  // Фильтрация поиска
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const name =
      `${u.fullName?.lastName} ${u.fullName?.firstName} ${u.fullName?.middleName}`.toLowerCase();
    const phone = u.phone || '';
    const addr =
      `${u.address?.area} ${u.address?.street} ${u.address?.house}`.toLowerCase();
    return name.includes(term) || phone.includes(term) || addr.includes(term);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
        {/* Навигация */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b gap-4">
          <div className="md:w-1/2">
            <h1 className="text-xl font-bold text-gray-800">
              Список жителей поселка
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Всего зарегистрировано: {users.length}
            </p>
          </div>
          <div className="w-full md:w-1/2 flex gap-2 justify-between md:justify-end">
            <Link
              href="/admin/users/create"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Добавить жителя
            </Link>
            <Link
              href="/admin"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              ← В панель чеков
            </Link>
          </div>
        </div>

        {/* Поиск */}
        <input
          type="text"
          placeholder="Поиск по ФИО, телефону или адресу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none"
        />

        {/* Таблица жильцов */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600 font-semibold uppercase text-xs">
                <th className="p-3">Телефон</th>
                <th className="p-3">ФИО</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Оплачен до</th>
                <th className="p-3">Автомобиль</th>
                <th className="p-3">Адрес</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    Жители не найдены.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-900 whitespace-nowrap">
                      {u.phone}
                    </td>
                    <td className="p-3 text-gray-800">
                      {u.fullName?.lastName} {u.fullName?.firstName}{' '}
                      {u.fullName?.middleName}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : u.status === 'grace'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status === 'active'
                          ? 'Активен'
                          : u.status === 'grace'
                            ? 'Грейс'
                            : 'Отключен'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-900">
                      {u.paidUntil
                        ? new Date(u.paidUntil).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {u.phones?.[0]?.carModel}{' '}
                      <span className="font-semibold">
                        {u.phones?.[0]?.carPlate}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {u.address?.area}, ул. {u.address?.street}, д.{' '}
                      {u.address?.house}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
