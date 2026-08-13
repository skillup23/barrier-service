import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 },
      );
    }

    const userId = session.user?.['id'];
    const { action, address, carPlate, carModel, oldPassword, newPassword } =
      await req.json();

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    // Редактирование профиля
    if (action === 'update_info') {
      if (address) {
        user.address = {
          area: address.area || user.address.area,
          street: address.street || user.address.street,
          house: address.house || user.address.house,
        };
      }
      if (user.phones && user.phones.length > 0) {
        user.phones[0].carPlate =
          carPlate !== undefined ? carPlate : user.phones[0].carPlate;
        user.phones[0].carModel =
          carModel !== undefined ? carModel : user.phones[0].carModel;
      }
      await user.save();
      return NextResponse.json({
        success: true,
        message: 'Данные профиля обновлены',
      });
    }

    // Смена пароля
    if (action === 'change_password') {
      if (!oldPassword || !newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Новый пароль должен быть не менее 6 символов' },
          { status: 400 },
        );
      }

      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Старый пароль указан неверно' },
          { status: 400 },
        );
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();
      return NextResponse.json({
        success: true,
        message: 'Пароль успешно изменен',
      });
    }

    return NextResponse.json(
      { error: 'Неизвестное действие' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить данные' },
      { status: 500 },
    );
  }
}
