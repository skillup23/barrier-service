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
    const {
      action,
      fullName,
      address,
      carPlate,
      carModel,
      oldPassword,
      newPassword,
    } = await req.json();

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    // Редактирование профиля (ФИО, адрес, автомобиль)
    if (action === 'update_info') {
      if (fullName) {
        user.fullName = {
          lastName:
            fullName.lastName !== undefined
              ? fullName.lastName.trim()
              : user.fullName?.lastName || '',
          firstName:
            fullName.firstName !== undefined
              ? fullName.firstName.trim()
              : user.fullName?.firstName || '',
          middleName:
            fullName.middleName !== undefined
              ? fullName.middleName.trim()
              : user.fullName?.middleName || '',
        };
      }

      if (address) {
        user.address = {
          area:
            address.area !== undefined
              ? address.area.trim()
              : user.address?.area || '',
          street:
            address.street !== undefined
              ? address.street.trim()
              : user.address?.street || '',
          house:
            address.house !== undefined
              ? address.house.trim()
              : user.address?.house || '',
        };
      }

      if (carPlate !== undefined || carModel !== undefined) {
        if (!user.phones || user.phones.length === 0) {
          user.phones = [{ phone: user.phone, carPlate: '', carModel: '' }];
        }
        if (carPlate !== undefined) user.phones[0].carPlate = carPlate.trim();
        if (carModel !== undefined) user.phones[0].carModel = carModel.trim();
      }

      await user.save();
      return NextResponse.json({
        success: true,
        message: 'Данные профиля успешно сохранены',
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
