import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// В ESM нет __dirname — восстановим его и загрузим .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Модули, зависящие от env, будут импортированы внутри функции seed()

async function seed() {
  try {
    const { default: connectToDatabase } = await import('../lib/mongodb.js');
    const { default: User } = await import('../models/User.js');

    await connectToDatabase();
    console.log('Подключение к MongoDB установлено...');

    await User.deleteMany({});
    console.log('Коллекция users очищена.');

    const defaultPassword = 'password1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Модератор
    await User.create({
      phone: '+79000000000',
      passwordHash: hashedPassword,
      role: 'admin',
      fullName: {
        lastName: 'Администратор',
        firstName: 'Главный',
        middleName: 'Модератор',
      },
      address: {
        area: 'АДМИНИСТРАЦИЯ',
        street: 'Главная',
        house: '1',
      },
      phones: [],
      entranceFeePaid: true,
      status: 'active',
    });

    // Житель
    await User.create({
      phone: '+79991112233',
      passwordHash: hashedPassword,
      role: 'user',
      fullName: {
        lastName: 'Иванов',
        firstName: 'Иван',
        middleName: 'Иванович',
      },
      address: {
        area: 'СНТ_Ветерок',
        street: 'Вишневая',
        house: '15',
      },
      phones: [
        {
          phone: '+79991112233',
          carPlate: 'А123АА123',
          carModel: 'Kia Rio',
        },
      ],
      entranceFeePaid: true,
      status: 'active',
      paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log('✅ Тестовые пользователи успешно созданы:');
    console.log(
      ` - Модератор: Телефон +79000000000 | Пароль: ${defaultPassword}`,
    );
    console.log(
      ` - Житель:    Телефон +79991112233 | Пароль: ${defaultPassword}`,
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при выполнении сид-скрипта:', error);
    process.exit(1);
  }
}

seed();
