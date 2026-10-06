'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CreateUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [lastName, setLastName] = useState('Заполнить');
  const [firstName, setFirstName] = useState('Заполнить');
  const [middleName, setMiddleName] = useState('Заполнить');
  const [area, setArea] = useState('Выберите СНТ / Район');
  const [street, setStreet] = useState('Заполнить');
  const [house, setHouse] = useState('Заполнить');
  const [carPlate, setCarPlate] = useState('Заполнить');
  const [carModel, setCarModel] = useState('Заполнить');
  const [entranceFeePaid, setEntranceFeePaid] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (
      status === 'authenticated' &&
      session?.user?.['role'] !== 'admin'
    ) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password,
          lastName,
          firstName,
          middleName,
          area,
          street,
          house,
          carPlate,
          carModel,
          entranceFeePaid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка добавления');

      router.push('/admin/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">
            Регистрация нового жителя
          </h1>
          <Link
            href="/admin/users"
            className="text-sm text-gray-600 hover:underline"
          >
            ← Назад к списку
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Номер телефона *
              </label>
              <input
                type="text"
                placeholder="+79991112233"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^\d+]/g, '');
                  setPhone(val);
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                pattern="\+7\d{10}"
                title="Номер должен быть в формате +7 и 10 цифр"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Временный пароль *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Отчество
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                СНТ / Район *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              >
                <option value="Выберите СНТ / Район">
                  Выберите СНТ / Район
                </option>
                <option value="СНТ_Ветерок">СНТ_Ветерок</option>
                <option value="СНТ_Ветерок-2">СНТ_Ветерок-2</option>
                <option value="СНТ_Дружба-1">СНТ_Дружба-1</option>
                <option value="СНТ_Радист">СНТ_Радист</option>
                <option value="СНТ_Животновод">СНТ_Животновод</option>
                <option value="СНТ_Мечта">СНТ_Мечта</option>
                <option value="СНТ_Солнышко">СНТ_Солнышко</option>
                <option value="СНТ_КНИИСХ">СНТ_КНИИСХ</option>
                <option value="АДМИНИСТРАЦИЯ">АДМИНИСТРАЦИЯ</option>
                <option value="Жители_района">Жители_района</option>
              </select>
              {/* <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              /> */}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Улица *
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дом *
              </label>
              <input
                type="text"
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Марка авто
              </label>
              <input
                type="text"
                placeholder="Kia Rio"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Гос. номер авто
              </label>
              <input
                type="text"
                placeholder="А123АА23"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fee"
              checked={entranceFeePaid}
              onChange={(e) => setEntranceFeePaid(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="fee" className="text-sm text-gray-700 select-none">
              Вступительный взнос оплачен
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-base text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Создание...' : 'Зарегистрировать жителя'}
          </button>
        </form>
      </div>
    </div>
  );
}
