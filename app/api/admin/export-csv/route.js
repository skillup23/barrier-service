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
    let csvContent = 'id;telephon;out\n';
    let counter = 1;

    activeUsers.forEach((user) => {
      user.phones.forEach((item) => {
        if (item.phone) {
          // Форматируем номер без + для шлагбаума (7928XXXXXXX)
          let cleanPhone = item.phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('8') && cleanPhone.length === 11) {
            cleanPhone = '7' + cleanPhone.slice(1);
          }
          csvContent += `${counter};${cleanPhone};0\n`;
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
    console.error('Ошибка экспорта CSV:', error);
    return NextResponse.json(
      { error: 'Не удалось сгенерировать CSV' },
      { status: 500 },
    );
  }
}
