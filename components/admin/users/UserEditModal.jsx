'use client';

import { useState } from 'react';

export default function UserEditModal({ user, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    lastName: user.fullName?.lastName || '',
    firstName: user.fullName?.firstName || '',
    middleName: user.fullName?.middleName || '',
    area: user.address?.area || '',
    street: user.address?.street || '',
    house: user.address?.house || '',
    status: user.status || 'active',
    paidUntil: user.paidUntil
      ? new Date(user.paidUntil).toISOString().slice(0, 10)
      : '',
    carPlate: user.phones?.[0]?.carPlate || '',
    carModel: user.phones?.[0]?.carModel || '',
    entranceFeePaid: Boolean(user.entranceFeePaid),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          fullName: {
            lastName: formData.lastName,
            firstName: formData.firstName,
            middleName: formData.middleName,
          },
          address: {
            area: formData.area,
            street: formData.street,
            house: formData.house,
          },
          status: formData.status,
          paidUntil: formData.paidUntil,
          carPlate: formData.carPlate,
          carModel: formData.carModel,
          entranceFeePaid: formData.entranceFeePaid,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSaveSuccess();
      } else {
        setError(data.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      setError('Ошибка сервера при обновлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-lg text-gray-800">
            Редактирование жителя
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Телефон
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Статус
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none"
              >
                <option value="active">Активен</option>
                <option value="grace">Требует оплаты</option>
                <option value="disabled">Заблокирован</option>
                <option value="frozen">Заморожен (отпуск/пауза)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Фамилия
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Имя
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Отчество
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                СНТ / Район
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Улица
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Дом
              </label>
              <input
                type="text"
                value={formData.house}
                onChange={(e) =>
                  setFormData({ ...formData, house: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Оплачен до (Дата)
              </label>
              <input
                type="date"
                value={formData.paidUntil}
                onChange={(e) =>
                  setFormData({ ...formData, paidUntil: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Марка авто
              </label>
              <input
                type="text"
                value={formData.carModel}
                onChange={(e) =>
                  setFormData({ ...formData, carModel: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Гос. номер авто
              </label>
              <input
                type="text"
                value={formData.carPlate}
                onChange={(e) =>
                  setFormData({ ...formData, carPlate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editEntranceFee"
              checked={formData.entranceFeePaid}
              onChange={(e) =>
                setFormData({ ...formData, entranceFeePaid: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label
              htmlFor="editEntranceFee"
              className="text-xs text-gray-700 select-none"
            >
              Вступительный взнос оплачен
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
