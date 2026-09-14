'use client';

import { useState } from 'react';

const cleanValue = (val) => {
  if (!val) return '';
  const trimmed = String(val).trim();
  const lower = trimmed.toLowerCase();
  if (['нет данных', 'нет', '-', 'null', 'undefined'].includes(lower))
    return '';
  return trimmed;
};

export default function ProfileEditSection({
  user,
  onProfileUpdated,
  onSuccessMessage,
}) {
  const [lastName, setLastName] = useState(() =>
    cleanValue(user?.fullName?.lastName),
  );
  const [firstName, setFirstName] = useState(() =>
    cleanValue(user?.fullName?.firstName),
  );
  const [middleName, setMiddleName] = useState(() =>
    cleanValue(user?.fullName?.middleName),
  );

  const [area, setArea] = useState(() => cleanValue(user?.address?.area));
  const [street, setStreet] = useState(() => cleanValue(user?.address?.street));
  const [house, setHouse] = useState(() => cleanValue(user?.address?.house));

  const [carModel, setCarModel] = useState(() =>
    cleanValue(user?.phones?.[0]?.carModel),
  );
  const [carPlate, setCarPlate] = useState(() =>
    cleanValue(user?.phones?.[0]?.carPlate),
  );

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_info',
          fullName: { lastName, firstName, middleName },
          address: { area, street, house },
          carPlate,
          carModel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onSuccessMessage) onSuccessMessage(data.message);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          oldPassword: oldPass,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onSuccessMessage) onSuccessMessage(data.message);
        setOldPass('');
        setNewPass('');
      } else {
        alert(data.error || 'Ошибка смены пароля');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
      <h2 className="text-lg font-bold text-gray-800">
        Управление личными данными
      </h2>

      <form onSubmit={handleUpdateInfo} className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700 border-b pb-1 mb-3">
            Ваши ФИО
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Отчество"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 border-b pb-1 mb-3">
            Адрес участка / дома
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="СНТ / Район"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Улица"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Дом / участок"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 border-b pb-1 mb-3">
            Данные автомобиля
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Марка (напр. Kia Rio)"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Гос. номер (напр. А123АА23)"
              value={carPlate}
              onChange={(e) => setCarPlate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="space-y-4 pt-4 border-t border-gray-200"
      >
        <h3 className="text-sm font-bold text-gray-700">Сменить пароль</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="password"
            placeholder="Старый пароль"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            required
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
          />
          <input
            type="password"
            placeholder="Новый пароль (мин. 6 символов)"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Обновить пароль
        </button>
      </form>
    </div>
  );
}
