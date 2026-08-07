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
    const now = new Date();

    const users = await User.find({ role: 'user' });
    let updatedGrace = 0;
    let updatedDisabled = 0;

    for (const user of users) {
      const paidUntil = new Date(user.paidUntil || 0);
      const diffMs = now - paidUntil;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays <= 7) {
        // Просрочка до 7 дней -> переводим в Grace
        if (user.status !== 'grace') {
          user.status = 'grace';
          await user.save();
          updatedGrace++;
        }
      } else if (diffDays > 7) {
        // Просрочка больше 7 дней -> Выключаем
        if (user.status !== 'disabled') {
          user.status = 'disabled';
          await user.save();
          updatedDisabled++;
        }
      } else if (diffDays <= 0 && user.status !== 'active') {
        user.status = 'active';
        await user.save();
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
