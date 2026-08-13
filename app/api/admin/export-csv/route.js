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

    // Выбираем жителей со статусом active или grace
    const activeUsers = await User.find({
      role: 'user',
      status: { $in: ['active', 'grace'] },
    });

    // Собираем все разрешенные номера телефонов из массива phones
    // \uFEFF добавляет Byte Order Mark (BOM) для корректного открытия UTF-8 в Excel
    let csvContent = '\uFEFFid;telephon;out\n';
    let counter = 1;

    activeUsers.forEach((user) => {
      user.phones.forEach((item) => {
        if (item.phone) {
          let digits = item.phone.replace(/\D/g, '');
          if (
            digits.length === 11 &&
            (digits.startsWith('7') || digits.startsWith('8'))
          ) {
            digits = digits.slice(1);
          }
          // ПУНКТ 3: Формат с +7
          const formattedPhone = `+7${digits}`;
          csvContent += `${counter};${formattedPhone};0\n`;
          counter++;
        }
      });
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="work_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Ошибка CSV:', error);
    return NextResponse.json(
      { error: 'Не удалось сгенерировать CSV' },
      { status: 500 },
    );
  }
}
