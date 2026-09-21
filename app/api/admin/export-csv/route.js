import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();

    // 1. Получаем администратора
    const adminUser = await User.findOne({ role: 'admin' });

    // 2. Получаем жителей, у которых есть право проезда (active и grace)
    // Замороженные ('frozen') и заблокированные ('disabled') не попадают
    const activeResidents = await User.find({
      role: 'user',
      status: { $in: ['active', 'grace'] },
    });

    const addedPhones = new Set();
    const phoneList = [];

    // Функция нормализации номера для шлагбаума (+79XXXXXXXXX)
    const formatPhone = (rawPhone) => {
      if (!rawPhone) return null;
      let digits = String(rawPhone).replace(/\D/g, '');
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7') && digits.length === 10)
        digits = '7' + digits;
      return digits.length === 11 ? `+${digits}` : null;
    };

    // 1. АДМИН ВСЕГДА НА 1-М МЕСТЕ ПОСЛЕ ЗАГОЛОВКОВ
    if (adminUser) {
      const adminPhone = formatPhone(adminUser.phone);
      if (adminPhone) {
        phoneList.push(adminPhone);
        addedPhones.add(adminPhone);
      }
    }

    // 2. Добавляем активных жителей
    for (const user of activeResidents) {
      // Основной номер
      const mainPhone = formatPhone(user.phone);
      if (mainPhone && !addedPhones.has(mainPhone)) {
        phoneList.push(mainPhone);
        addedPhones.add(mainPhone);
      }

      // Дополнительные номера телефонов (если есть)
      if (Array.isArray(user.phones)) {
        for (const item of user.phones) {
          const extraPhone = formatPhone(item.phone);
          if (extraPhone && !addedPhones.has(extraPhone)) {
            phoneList.push(extraPhone);
            addedPhones.add(extraPhone);
          }
        }
      }
    }

    // Собираем строки таблицы с разделителем ";"
    // Формат: id;telephon;out
    const csvLines = ['id;telephon;out'];

    phoneList.forEach((phone, index) => {
      const id = index + 1; // Порядковый номер начиная с 1
      csvLines.push(`${id};${phone};0`);
    });

    // \ufeff — UTF-8 BOM, чтобы Excel и GSM-модули без сбоев читали кодировку
    const csvContent = '\ufeff' + csvLines.join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="barrier_phones.csv"',
      },
    });
  } catch (error) {
    console.error('Ошибка выгрузки CSV:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации CSV' },
      { status: 500 },
    );
  }
}
