import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();

    // Сегодняшний день в 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.find({ role: 'user' });
    const bulkOps = [];
    let updatedGrace = 0;
    let updatedDisabled = 0;
    let updatedActive = 0;

    for (const user of users) {
      // 1. Проверяем наличие даты
      if (!user.paidUntil) {
        // Если даты нет вовсе — блокируем пользователя
        if (user.status !== 'disabled') {
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { status: 'disabled' } },
            },
          });
          updatedDisabled++;
        }
        continue;
      }

      // 2. Безопасный парсинг даты
      const paidDate = new Date(user.paidUntil);
      if (isNaN(paidDate.getTime())) {
        // Невалидный формат даты в базе (например, строковый мусор из Excel)
        if (user.status !== 'disabled') {
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { status: 'disabled' } },
            },
          });
          updatedDisabled++;
        }
        continue;
      }

      paidDate.setHours(0, 0, 0, 0);

      // Разница в календарных днях
      const diffTime = today.getTime() - paidDate.getTime();
      const overdueDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let newStatus = user.status;

      if (overdueDays >= 1 && overdueDays <= 7) {
        newStatus = 'grace';
      } else if (overdueDays > 7) {
        newStatus = 'disabled';
      } else {
        newStatus = 'active';
      }

      // Если статус действительно изменился — добавляем в пакетное обновление
      if (newStatus !== user.status) {
        bulkOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: { status: newStatus } },
          },
        });

        if (newStatus === 'grace') updatedGrace++;
        if (newStatus === 'disabled') updatedDisabled++;
        if (newStatus === 'active') updatedActive++;
      }
    }

    // Выполняем одно пакетное обновление для всех 382 пользователей сразу
    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      message: `Проверка завершена. В Grace-период: ${updatedGrace}, Заблокировано: ${updatedDisabled}, Активировано: ${updatedActive}`,
    });
  } catch (error) {
    console.error('Критическая ошибка cron-billing:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при выполнении биллинга' },
      { status: 500 },
    );
  }
}
