'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition, useCallback } from 'react';
import Link from 'next/link';

import UserFilterBar from '@/components/admin/users/UserFilterBar';
import UserTableRow from '@/components/admin/users/UserTableRow';
import UserEditModal from '@/components/admin/users/UserEditModal';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

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
        Загрузка жителей...
      </div>
    );
  }

  // Фильтрация
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const name =
      `${u.fullName?.lastName || ''} ${u.fullName?.firstName || ''} ${u.fullName?.middleName || ''}`.toLowerCase();
    const phone = u.phone || '';
    const addr =
      `${u.address?.area || ''} ${u.address?.street || ''} ${u.address?.house || ''}`.toLowerCase();
    const matchesSearch =
      name.includes(term) || phone.includes(term) || addr.includes(term);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Сортировка
  filteredUsers.sort((a, b) => {
    const dateA = a.paidUntil ? new Date(a.paidUntil).getTime() : 0;
    const dateB = b.paidUntil ? new Date(b.paidUntil).getTime() : 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Список жителей поселка
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Всего в базе: {users.length} (отфильтровано:{' '}
              {filteredUsers.length})
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Фильтры */}
        <UserFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOrder={sortOrder}
          onToggleSort={() =>
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
          }
        />

        {/* Таблица */}
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
                <th className="p-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    Жители не найдены.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <UserTableRow
                    key={u._id}
                    user={u}
                    onEdit={(userToEdit) => setSelectedUser(userToEdit)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Модалка */}
        {selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSaveSuccess={() => {
              setSelectedUser(null);
              fetchUsers();
            }}
          />
        )}
      </div>
    </div>
  );
}
