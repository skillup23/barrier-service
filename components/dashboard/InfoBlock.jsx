// блок справочной информации (QR-код, телефон шлагбаума, поддержка, ссылки 152-ФЗ).
import Image from 'next/image';
import Link from 'next/link';

export default function InfoBlock({ qrcodeImage }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-gray-800 border-b pb-3">
        Справочная информация
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {qrcodeImage && (
          <div className="flex flex-col items-center sm:items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              QR-код для быстрой оплаты
            </span>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <Image
                src={qrcodeImage}
                width={180}
                height="auto"
                alt="QR-код для платежей"
                className="rounded-md object-contain"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center sm:text-left">
              Отсканируйте в приложении вашего банка
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
            <span className="block text-xs font-medium text-gray-500 mb-1">
              Номер для открытия шлагбаума
            </span>
            <a
              href="tel:89892762294"
              className="inline-flex items-center gap-2 text-lg font-bold text-blue-600 hover:text-blue-700 transition"
            >
              📞 8 (989) 276-22-94
            </a>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
            <span className="block text-xs font-medium text-gray-500 mb-1">
              Техническая поддержка
            </span>
            <a
              href="https://max.ru/join/bbjQHb-pe53EP3-ef5J-Ezvurt14hnDTdNlZTx9vE8o"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-base font-bold text-sky-600 hover:text-sky-700 transition"
            >
              💬 Написать в MAX-чат
            </a>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-500">
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
  );
}
