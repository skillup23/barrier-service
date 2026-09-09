'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Функция автоформатирования номера
  const handlePhoneChange = (e) => {
    let input = e.target.value;

    // Извлекаем только цифры
    let digits = input.replace(/\D/g, '');

    // Если пользователь стер всё поле
    if (!digits) {
      setPhone('');
      return;
    }

    // Если первая цифра 8 или 7 — меняем код страны на 7
    if (digits[0] === '8' || digits[0] === '7') {
      digits = '7' + digits.slice(1);
    } else if (digits[0] === '9') {
      // Если начинает сразу с 9 — подставляем 7 в начало
      digits = '7' + digits;
    } else {
      // Для любых других первых цифр сохраняем логику +7
      digits = '7' + digits;
    }

    // Ограничиваем номер 11 цифрами (7 + 10 цифр)
    digits = digits.slice(0, 11);

    // Форматируем красивую маску для отображения: +7 (XXX) XXX-XX-XX
    let formatted = '+7';
    if (digits.length > 1) {
      formatted += ' (' + digits.slice(1, 4);
    }
    if (digits.length >= 5) {
      formatted += ') ' + digits.slice(4, 7);
    }
    if (digits.length >= 8) {
      formatted += '-' + digits.slice(7, 9);
    }
    if (digits.length >= 10) {
      formatted += '-' + digits.slice(9, 11);
    }

    setPhone(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Приводим к стандарту БД: +79XXXXXXXXX (11 цифр с плюсом)
    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = `+${rawDigits}`;

    try {
      const result = await signIn('credentials', {
        phone: cleanPhone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Произошла ошибка при входе в систему');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Вход в систему шлагбаума
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер телефона
            </label>
            <input
              type="tel"
              placeholder="+7 (999) 111-22-33"
              value={phone}
              onChange={handlePhoneChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base tracking-wide font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Сервис автоматического доступа жителей
        </div>
      </div>
    </div>
  );
}
