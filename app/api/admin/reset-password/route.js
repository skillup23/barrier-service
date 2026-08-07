import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.['role'];

    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { targetPhone, newPassword } = await req.json();

    if (!targetPhone || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Укажите телефон и новый пароль (минимум 6 символов)' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ phone: targetPhone.trim() });
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером не найден' },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Пароль для аккаунта ${user.phone} успешно изменен`,
    });
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
    return NextResponse.json(
      { error: 'Не удалось сбросить пароль' },
      { status: 500 },
    );
  }
}
