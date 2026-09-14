import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Некорректный ID пользователя' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const data = await req.json();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден в базе данных' },
        { status: 404 },
      );
    }

    // --- ЛОГИКА ЗАМОРОЗКИ / РАЗМОРОЗКИ ---
    if (data.status && data.status !== user.status) {
      const now = new Date();

      if (data.status === 'frozen') {
        // Включаем заморозку: фиксируем текущую дату
        user.status = 'frozen';
        user.frozenAt = now;
      } else if (user.status === 'frozen') {
        // Снимаем заморозку: вычисляем дни и сдвигаем paidUntil вперед
        if (user.frozenAt) {
          const frozenDate = new Date(user.frozenAt);
          // Количество полных дней заморозки (минимум 1 день, если разморозили на следующий день)
          const diffMs = now.getTime() - frozenDate.getTime();
          const frozenDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (frozenDays > 0 && user.paidUntil) {
            const currentPaidUntil = new Date(user.paidUntil);
            currentPaidUntil.setDate(currentPaidUntil.getDate() + frozenDays);
            user.paidUntil = currentPaidUntil;
          }
        }
        user.frozenAt = null;
        user.status = data.status;
      } else {
        user.status = data.status;
      }
    }

    // Основные поля
    if (data.phone) user.phone = data.phone.trim();

    if (data.fullName) {
      user.fullName = {
        lastName: data.fullName.lastName ?? user.fullName?.lastName ?? '',
        firstName: data.fullName.firstName ?? user.fullName?.firstName ?? '',
        middleName: data.fullName.middleName ?? user.fullName?.middleName ?? '',
      };
    }

    if (data.address) {
      user.address = {
        area: data.address.area ?? user.address?.area ?? '',
        street: data.address.street ?? user.address?.street ?? '',
        house: data.address.house ?? user.address?.house ?? '',
      };
    }

    if (data.paidUntil && user.status !== 'frozen') {
      const parsedDate = new Date(data.paidUntil);
      if (!isNaN(parsedDate.getTime())) {
        user.paidUntil = parsedDate;
      }
    }

    if (data.entranceFeePaid !== undefined) {
      user.entranceFeePaid = Boolean(data.entranceFeePaid);
    }

    // Автомобиль
    if (data.carPlate !== undefined || data.carModel !== undefined) {
      if (!user.phones || user.phones.length === 0) {
        user.phones = [{ phone: user.phone, carPlate: '', carModel: '' }];
      }
      user.phones[0].carPlate = data.carPlate ?? user.phones[0].carPlate ?? '';
      user.phones[0].carModel = data.carModel ?? user.phones[0].carModel ?? '';
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Данные жителя успешно сохранены',
      user,
    });
  } catch (error) {
    console.error('Ошибка сохранения данных пользователя:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера при обновлении данных' },
      { status: 500 },
    );
  }
}
