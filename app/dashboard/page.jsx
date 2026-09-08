'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition, useCallback } from 'react';
import qrcode from '@/public/qr-code.png';
import Link from 'next/link';

export default function ResidentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [isEntranceFee, setIsEntranceFee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Состояния редактирования
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [carModel, setCarModel] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [editMsg, setEditMsg] = useState('');

  // Загрузка актуального профиля из MongoDB
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (res.ok && data.user) {
        setUserData(data.user);
        setArea(data.user.address?.area || '');
        setStreet(data.user.address?.street || '');
        setHouse(data.user.address?.house || '');
        if (data.user.phones?.[0]) {
          setCarPlate(data.user.phones[0].carPlate || '');
          setCarModel(data.user.phones[0].carModel || '');
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      startTransition(() => {
        fetchUserProfile();
      });
    }
  }, [status, router, fetchUserProfile]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
        Загрузка...
      </div>
    );
  }

  if (!session) return null;

  const sessionUser = session?.user || {};
  const currentUser = userData || {};

  // Расчет оставшихся дней и форматирование даты
  const calculateDaysLeft = (paidUntilDate) => {
    if (!paidUntilDate)
      return { days: 0, dateStr: 'Нет данных', isExpired: true };
    const target = new Date(paidUntilDate);
    const now = new Date();
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dateStr = target.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return {
      days: diffDays > 0 ? diffDays : 0,
      dateStr,
      isExpired: diffDays <= 0,
    };
  };

  const { days, dateStr, isExpired } = calculateDaysLeft(currentUser.paidUntil);

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!file || !amount) {
      setError('Выберите файл чека и укажите сумму');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('amount', amount);
    formData.append('isEntranceFee', isEntranceFee);

    try {
      const res = await fetch('/api/payments/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при загрузке');

      setMessage(data.message);
      setFile(null);
      setAmount('');
      setIsEntranceFee(false);
      const inputEl = document.getElementById('receiptInput');
      if (inputEl) inputEl.value = '';
      fetchUserProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение личных данных
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setEditMsg('');
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_info',
          address: { area, street, house },
          carPlate,
          carModel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMsg(data.message);
        fetchUserProfile();
      } else alert(data.error);
    } catch (err) {
      console.error(err);
    }
  };

  // Смена своего пароля
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setEditMsg('');
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
        setEditMsg(data.message);
        setOldPass('');
        setNewPass('');
      } else alert(data.error);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-1 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Личный Кабинет Жителя
            </h1>
            <p className="text-lg text-gray-500 mt-1">
              {sessionUser.name} | Тел:&nbsp;
              <span className="font-medium text-gray-700">
                {sessionUser.phone}
              </span>
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-lg bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition cursor-pointer"
          >
            Выйти
          </button>
        </div>

        {/* Статус */}
        <div
          className={`p-6 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            isExpired
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div>
            <span
              className={`inline-block px-3 py-1 text-sm font-bold rounded-full uppercase mb-2 ${
                isExpired
                  ? 'bg-red-200 text-red-800'
                  : 'bg-green-200 text-green-800'
              }`}
            >
              {isExpired
                ? 'Статус: Требуется оплата'
                : 'Статус: Проезд разрешен'}
            </span>
            <p
              className={`text-base font-semibold ${isExpired ? 'text-red-900' : 'text-green-900'}`}
            >
              Оплачено до: <span className="underline">{dateStr}</span>
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Осталось дней
            </p>
            <p
              className={`text-3xl font-extrabold ${isExpired ? 'text-red-600' : 'text-green-700'}`}
            >
              {days}{' '}
              {days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней'}
            </p>
          </div>
        </div>

        {/* Инфо об авто и адресе */}
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 text-base text-blue-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-bold block mb-1">📍 Ваш Адрес:</span>
            {currentUser.address?.area}, ул. {currentUser.address?.street}, д.{' '}
            {currentUser.address?.house}
          </div>
          <div>
            <span className="font-bold block mb-1">🚘 Автомобиль:</span>
            {currentUser.phones?.[0]?.carModel || 'Не указана'} —{' '}
            <span className="font-semibold">
              {currentUser.phones?.[0]?.carPlate || 'Без номера'}
            </span>
          </div>
        </div>

        {/* Форма загрузки чека */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Загрузить новый платёж (чек)
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-lg border border-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-lg border border-green-200">
              {message}
            </div>
          )}

          <form onSubmit={handleUploadPayment} className="space-y-4">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">
                Сумма платежа (₽)
              </label>
              <input
                type="number"
                placeholder="к примеру 75"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full md:w-1/2 px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">
                Файл чека (PDF, JPG, PNG)
              </label>
              <input
                id="receiptInput"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="w-full text-lg text-gray-500 cursor-pointer border border-gray-300 rounded-lg focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-lg file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="entranceFee"
                checked={isEntranceFee}
                onChange={(e) => setIsEntranceFee(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label
                htmlFor="entranceFee"
                className="text-lg text-gray-700 select-none"
              >
                Включает вступительный взнос 700 ₽ за первые 2 номера
                (отмечайте, если регистрируетесь впервые)
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-xl text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {loading ? 'Отправка...' : 'Отправить чек модератору'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Нажимая кнопку, вы принимаете{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Условия использования
              </Link>{' '}
              и даете{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                согласие на обработку персональных данных
              </Link>
            </p>
          </form>
        </div>

        {/* Форма редактирования данных и смены пароля */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">
            Управление личными данными
          </h2>

          {editMsg && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-200">
              {editMsg}
            </div>
          )}

          {/* Редактирование авто и адреса */}
          <form onSubmit={handleUpdateInfo} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-1">
              Изменить адрес и автомобиль
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="СНТ / Район"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder="Улица"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder="Дом"
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Марка машины (напр. Kia Rio)"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder="Гос. номер (напр. А123АА23)"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-800 hover:bg-gray-900 text-white text-lg font-medium px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Сохранить данные
            </button>
          </form>

          {/* Смена своего пароля */}
          <form
            onSubmit={handleChangePassword}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-700">Сменить пароль</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Старый пароль"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
              <input
                type="password"
                placeholder="Новый пароль (мин. 6 символов)"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-800 hover:bg-gray-900 text-white text-lg font-medium px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Обновить пароль
            </button>
          </form>
        </div>

        {/* Общая информация */}
        {/* Общая информация */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-3">
            Справочная информация
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Левая колонка: QR-код */}
            <div className="flex flex-col items-center sm:items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                QR-код для быстрой оплаты
              </span>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <Image
                  src={qrcode}
                  width={180}
                  height={180}
                  alt="QR-код для платежей"
                  className="rounded-md object-contain"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2 text-center sm:text-left">
                Отсканируйте в приложении вашего банка
              </p>
            </div>

            {/* Правая колонка: Быстрые контакты и ссылки */}
            <div className="space-y-4">
              {/* Телефон шлагбаума */}
              <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-lg font-medium text-gray-500 mb-1">
                  Номер для открытия шлагбаума
                </span>
                <a
                  href="tel:89991234567"
                  className="inline-flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition"
                >
                  📞 8 (999) 123-45-67
                </a>
              </div>

              {/* Техподдержка Telegram */}
              <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-lg font-medium text-gray-500 mb-1">
                  Техническая поддержка
                </span>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xl font-bold text-sky-600 hover:text-sky-700 transition"
                >
                  💬 Написать в Telegram-чат
                </a>
              </div>

              {/* Ссылка на условия */}
              <div className="pt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                <Link
                  href="/terms"
                  target="_blank"
                  className="hover:text-gray-800 underline underline-offset-4"
                >
                  📄 Условия использования
                </Link>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="hover:text-gray-800 underline underline-offset-4"
                >
                  🔒 Политика конфиденциальности (152-ФЗ)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
