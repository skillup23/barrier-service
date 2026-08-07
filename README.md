### 🚧 Сервис управления доступом и биллингом шлагбаума
Автономный веб-сервис для жильцов и модератора шлагбаума поселка. Система закрывает сквозной проезд для посторонних, автоматизирует проверку платежей (чеков), ведет учет баланса с учетом грейс-периода и генерирует выгрузку номеров телефонов в формате CSV для шлагбаума.

### 🛠️ Технологический стек
Фреймворк: Next.js 14+ (App Router, JavaScript ES6+)
Стилизация: Tailwind CSS
База данных: MongoDB (взаимодействие через ORM Mongoose)
Аутентификация: NextAuth.js (JWT Сессии, Credentials Provider)
Хранилище файлов: Timeweb Cloud S3 (через @aws-sdk/client-s3)
Безопасность: bcryptjs (хеширование паролей)

### 📁 Структура проекта
barrier-service/
├── app/
│   ├── admin/
│   │   └── page.jsx             # Кабинет Модератора (Очередь чеков, сброс паролей, CSV)
│   ├── dashboard/
│   │   └── page.jsx             # Кабинет Жителя (Статус, оставшиеся дни, загрузка чека)
│   ├── login/
│   │   └── page.jsx             # Страница авторизации по номеру телефона и паролю
│   ├── api/
│   │   ├── admin/
│   │   │   ├── cron-billing/    # API: Перерасчет статусов (Grace / Disabled)
│   │   │   ├── export-csv/      # API: Выгрузка разрешенных номеров в CSV для шлагбаума
│   │   │   ├── payments/        # API: Получение и модерация (одобрение/отказ) чеков
│   │   │   └── reset-password/  # API: Сброс пароля пользователю/модератору
│   │   ├── auth/
│   │   │   └── [...nextauth]/   # Настройка и эндпоинты NextAuth.js
│   │   ├── payments/
│   │   │   └── upload/          # API: Загрузка PDF-чека жителем в Timeweb S3
│   │   └── user/
│   │       └── profile/         # API: Получение свежих данных профиля жителя
│   ├── layout.jsx               # Базовый макет с провайдерами
│   └── page.jsx                 # Главная страница (умный редирект по ролям)
├── components/
│   └── Providers.jsx            # Обертка SessionProvider для NextAuth
├── lib/
│   ├── mongodb.js               # Кешируемое подключение к MongoDB через Mongoose
│   └── s3.js                    # Клиент AWS SDK для загрузки файлов в Timeweb S3
├── models/
│   ├── Payment.js               # Схема MongoDB: Платежи и чеки
│   ├── Request.js               # Схема MongoDB: Заявки к модератору
│   └── User.js                  # Схема MongoDB: Пользователи (Жители и Админ)
├── scripts/
│   └── seed.js                  # Скрипт первичного наполнения БД (Тестовые аккаунты)
├── .env.example                 # Шаблон переменных окружения (безопасен для Git)
├── package.json
└── README.md

### 🔐 Безопасность и Переменные окружения (.env)
Никогда не выгружайте реальный файл .env или .env.local в публичный репозиторий! Файл .gitignore уже настроен на их игнорирование.
Для запуска проекта создайте локальный файл .env.local на основе шаблона .env.example:

Шаблон .env.example
`
    # Подключение к MongoDB
    # Формат: mongodb://<пользователь>:<пароль>@<host>:<port>/<dbname>?authSource=admin
    MONGODB_URI=mongodb://admin:your_password@127.0.0.1:27017/имя_db?authSource=admin

    # Настройки NextAuth
    NEXTAUTH_SECRET=your_random_secret_key_change_me
    NEXTAUTH_URL=http://localhost:3000

    # Timeweb Cloud S3 к примеру
    S3_ENDPOINT=https://s3.timeweb.cloud
    S3_REGION=ru-1
    S3_BUCKET_NAME=your_bucket_name
    S3_ACCESS_KEY=your_access_key
    S3_SECRET_KEY=your_secret_key 
`

### 🔑 Авторизация и Разграничение доступа
Авторизация построена на NextAuth.js с использованием стратеги JWT-токенов.
Логин: Номер телефона пользователя (например, +79991112233).
Пароль: Хешируется с помощью bcrypt (10 раундов salt).

Маршрутизация и Права Доступа:
1. Неавторизованный пользователь:
    - Доступен только маршрут /login.
    - При попытке зайти на /, /dashboard или /admin автоматически перенаправляет на /login.
2. Житель (role: 'user'):
    - При входе перенаправляется на /dashboard.
    - Имеет доступ к загрузке чеков и просмотру своего баланса.
    - При попытке зайти в /admin перенаправляется в /dashboard.
3. Модератор (role: 'admin'):
    - При входе перенаправляется на /admin.
    - Имеет полный доступ к очереди чеков, сбросу паролей всех жильцов, запуску биллинга и выгрузке CSV.


### 🌱 Для чего нужен scripts/seed.js?
Поскольку пароли в базе хранятся только в захешированном виде, вручную создать пользователя через GUI (MongoDB Compass) нельзя — он не сможет войти.
Скрипт scripts/seed.js служит для первичного наполнения базы данных. Он подключается к MongoDB и автоматически создает два готовых аккаунта:
Модератор: Телефон +79012345678, Пароль password123, role: 'admin'.
Тестовый житель: Телефон +79991112233, Пароль password123, role: 'user'.

Запуск скрипта:
`
    npm run seed
`


### 📡 Описание всех API Маршрутов
🔑 Авторизация
   - POST /api/auth/[...nextauth] — обработка входа через CredentialsProvider, проверка хеша пароля в MongoDB, выдача JWT-сессии.

👤 Пользователь (Житель)
   - GET /api/user/profile — возвращает свежие данные профиля авторизованного жителя (дата окончания оплаты paidUntil, статус, привязанный адрес).
   - POST /api/payments/upload — принимает FormData (file, amount, isEntranceFee). Валидирует файл (до 5 МБ, PDF/PNG/JPG), загружает его в Timeweb S3 и создает запись в коллекции payments со статусом pending.

🛡️ Панель Модератора (role: 'admin')
   - GET /api/admin/payments — возвращает список всех чеков, отсортированных по дате (включая данные жителя через .populate()).
   - POST /api/admin/payments — обработка решения по чеку:
     - Принять (action: 'approved'): Продлевает дату paidUntil жителя (на основе суммы и тарифа 75 ₽/мес), ставит статус active.
     - Отклонить (action: 'rejected'): Сохраняет указанную модератором причину отказа.
   - POST /api/admin/reset-password — сбрасывает пароль для любого указанного номера телефона.
   - POST /api/admin/cron-billing — запускает алгоритм проверки просрочек:
     - Просрочка до 7 дней $\rightarrow$ статус grace (проезд открыт).
     - Просрочка более 7 дней $\rightarrow$ статус disabled (проезд закрыт).
   - GET /api/admin/export-csv — формирует и скачивает файл work_YYYY-MM-DD.csv формата id;telephon;out со всеми активными номерами (active + grace).


### ⚡ Инструкция по локальному запуску
1. Клонировать репозиторий:
`
git clone https://github.com/your-username/barrier-service.git
cd barrier-service
`
2. Установить зависимости:
`
npm install
`
3. Настроить окружение:
Создайте файл .env.local и укажите данные подключения к вашей MongoDB и Timeweb S3 (см. раздел .env).
4. Запустить первичный сид базы:
`
npm run seed
`
5. Запустить сервер разработки:
`
npm run dev
`
Приложение будет доступно по адресу http://localhost:3000.


### 💡 Что и где менять, если понадобится доработка?
Изменить тарифы / стоимость подписки: Файл app/api/admin/payments/route.js (переменная monthlyRate).
Изменить структуру CSV для шлагбаума: Файл app/api/admin/export-csv/route.js.
Добавить новые поля пользователю: Схема models/User.js.
Изменить длительность Grace-периода (сейчас 7 дней): Файл app/api/admin/cron-billing/route.js.
