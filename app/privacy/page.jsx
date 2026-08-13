import Link from 'next/link';

export const metadata = {
  title: 'Политика обработки персональных данных (152-ФЗ) — Сервис Шлагбаума',
  description: 'Порядок сбора, хранения и защиты персональных данных жильцов',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200">
        {/* Шапка */}
        <div className="border-b pb-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Политика обработки персональных данных
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              В соответствии с Федеральным законом № 152-ФЗ «О персональных
              данных»
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
            <p>
              Настоящая Политика определяет порядок обработки и защиты
              персональной информации Пользователей Сервиса управления
              шлагбаумом в целях обеспечения прав и свобод человека при
              обработке его персональных данных.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              2. Состав собираемых данных
            </h2>
            <p className="mb-2">
              Сервис обрабатывает следующие персональные данные Пользователей:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Фамилия, имя, отчество;</li>
              <li>Номер мобильного телефона;</li>
              <li>
                Адрес проживания/нахождения участка (СНТ/район, улица, дом);
              </li>
              <li>
                Государственный регистрационный номер и марка/модель
                транспортного средства;
              </li>
              <li>Копии чеков и история проведенных платежей.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              3. Цели обработки персональных данных
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Идентификация Пользователя как жителя поселка для предоставления
                права проезда;
              </li>
              <li>
                Передача номера телефона в память оборудования шлагбаума
                исключительно для обеспечения открытия по звонку;
              </li>
              <li>
                Ведение учета абонентской платы и модерация платежных
                документов.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              4. Защита и передача данных
            </h2>
            <p className="mb-2">
              4.1. Персональные данные хранятся на защищенных серверах на
              территории Российской Федерации и{' '}
              <strong>не передаются третьим лицам</strong>, за исключением
              случаев, предусмотренных законодательством РФ.
            </p>
            <p>
              4.2. Администрация принимает необходимые технические и
              организационные меры для защиты персональных данных от
              неправомерного или случайного доступа.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              5. Права Пользователя
            </h2>
            <p>
              Пользователь вправе в любой момент отозвать свое согласие на
              обработку данных, направив обращение Модератору. Отзыв согласия
              влечет за собой удаление номера телефона из памяти шлагбаума и
              прекращение автоматического проезда.
            </p>
          </section>
        </div>

        {/* Подвал */}
        <div className="mt-8 pt-6 border-t flex justify-between items-center text-xs text-gray-500">
          <span>Сервис управления шлагбаумом</span>
          <Link href="/terms" className="text-blue-600 hover:underline">
            Пользовательское соглашение
          </Link>
        </div>
      </div>
    </div>
  );
}
