import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 },
      );
    }

    await connectToDatabase();
    const userId = session.user?.['id'];

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить данные профиля' },
      { status: 500 },
    );
  }
}
