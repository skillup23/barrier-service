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

    // Текущая дата строго по началу дня
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.find({ role: 'user' });
    let updatedGrace = 0;
    let updatedDisabled = 0;
    let updatedActive = 0;

    for (const user of users) {
      if (!user.paidUntil) continue;

      // Нормализуем дату окончания к началу дня
      const paidDate = new Date(user.paidUntil);
      paidDate.setHours(0, 0, 0, 0);

      // Разница в полных календарных днях
      const diffTime = today.getTime() - paidDate.getTime();
      const overdueDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (overdueDays >= 1 && overdueDays <= 7) {
        // Просрочка от 1 до 7 дней включительно -> GRACE
        if (user.status !== 'grace') {
          user.status = 'grace';
          await user.save();
          updatedGrace++;
        }
      } else if (overdueDays > 7) {
        // Просрочка 8 и более дней -> DISABLED
        if (user.status !== 'disabled') {
          user.status = 'disabled';
          await user.save();
          updatedDisabled++;
        }
      } else {
        // Срок еще не истек (overdueDays <= 0)
        if (user.status !== 'active') {
          user.status = 'active';
          await user.save();
          updatedActive++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Проверка биллинга завершена. В Grace-период: ${updatedGrace}, Заблокировано: ${updatedDisabled}`,
    });
  } catch (error) {
    console.error('Ошибка биллинга:', error);
    return NextResponse.json(
      { error: 'Ошибка при выполнении биллинга' },
      { status: 500 },
    );
  }
}
