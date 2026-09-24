'use client';

// форма прикрепления чека с суммой и чекбоксом.
import { useState } from 'react';

export default function ReceiptUploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [isEntranceFee, setIsEntranceFee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
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

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Загрузить новый платёж (чек)
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm border border-green-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сумма платежа (₽)
          </label>
          <input
            type="number"
            placeholder="75 или 700"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Файл чека (PDF, JPG, PNG)
          </label>
          <input
            id="receiptInput"
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files[0] || null)}
            required
            className={`w-full text-sm px-4 py-2 cursor-pointer border rounded-lg focus:outline-none transition-colors duration-200 ${
              file
                ? 'bg-green-50 border-green-400 text-green-900'
                : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          />
          {file && (
            <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
              ✓ Файл выбран: {file.name}
            </p>
          )}
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
            className="text-sm text-gray-700 select-none"
          >
            Включает вступительный взнос (700 ₽ за первые 2 номера)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Отправка...' : 'Отправить чек модератору'}
        </button>
      </form>
    </div>
  );
}
