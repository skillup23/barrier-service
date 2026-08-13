import Link from 'next/link';

export const metadata = {
  title: 'Пользовательское соглашение — Сервис Шлагбаума',
  description:
    'Условия использования сервиса контроля доступа и правила оплаты',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200">
        {/* Шапка */}
        <div className="border-b pb-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Пользовательское соглашение
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Дата публикации: 01 августа 2026 г.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            ← В кабинет
          </Link>
        </div>

        {/* Текст документа */}
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              1. Общие положения
            </h2>
            <p className="mb-2">
              1.1. Настоящее Пользовательское соглашение (далее — «Соглашение»)
              регулирует отношения между Администрацией сервиса и Пользователем
              (жителем поселка), возникающие при использовании веб-сервиса
              управления доступом к шлагбауму.
            </p>
            <p>
              1.2. Использование Сервиса означает полное и безоговорочное
              согласие Пользователя с настоящими условиями.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              2. Правила пользования и порядок оплаты
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Доступ к открытию шлагбаума предоставляется только
                Пользователям, внесенным в список активных абонентов.
              </li>
              <li>
                <strong>Вступительный взнос:</strong> 700 рублей (включает
                подключение первых двух номеров телефонов на один адрес).
              </li>
              <li>
                <strong>Ежемесячная плата:</strong> 75 рублей в месяц за 1 номер
                телефона.
              </li>
              <li>
                Пользователь самостоятельно загружает копию чека в личном
                кабинете. Заявки проверяются Модератором вручную.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              3. Льготный период (Грейс-период) и блокировка
            </h2>
            <p className="mb-2">
              3.1. При окончании оплаты Пользователю предоставляется{' '}
              <strong>
                льготный период сроком на 7 (семь) календарных дней
              </strong>
              , в течение которого номер остается в базе шлагбаума, а баланс
              уходит в минус.
            </p>
            <p className="mb-2">
              3.2. При пополнении баланса во время грейс-периода из внесенной
              суммы вычитается стоимость дней просрочки.
            </p>
            <p>
              3.3. При отсутствии оплаты по истечении 7 дней номер Пользователя
              блокируется. При последующей оплате вычитаются 7 дней
              использованного грейс-периода, а отчетный период начинается с
              момента проведения платежа Модератором.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              4. Ограничение ответственности
            </h2>
            <p>
              Администрация не несет ответственности за сбои в работе сотовых
              операторов, сторонних мессенджеров, оборудования шлагбаума или
              перебои в электроснабжении, а также за простой автотранспорта,
              возникший по причине несвоевременной оплаты Пользователем.
            </p>
          </section>
        </div>

        {/* Подвал */}
        <div className="mt-8 pt-6 border-t flex justify-between items-center text-xs text-gray-500">
          <span>Сервис управления шлагбаумом</span>
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Политика конфиденциальности (152-ФЗ)
          </Link>
        </div>
      </div>
    </div>
  );
}
