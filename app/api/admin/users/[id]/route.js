import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import { logBarrierChange } from '@/lib/barrierLogger';
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

    const now = new Date();

    // 1. Проверяем установку вступительного взноса
    // Если взнос ранее не был оплачен, а сейчас администратор ставит галочку
    const isPayingEntranceFeeNow =
      Boolean(data.entranceFeePaid) && !user.entranceFeePaid;

    if (data.entranceFeePaid !== undefined) {
      user.entranceFeePaid = Boolean(data.entranceFeePaid);
    }

    if (isPayingEntranceFeeNow) {
      // Активируем жителя и даем ровно 1 день от текущей даты
      const newPaidUntil = new Date(now);
      newPaidUntil.setDate(newPaidUntil.getDate() + 1);
      user.paidUntil = newPaidUntil;
      user.status = 'active';
      user.frozenAt = null;

      const uName =
        `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
      await logBarrierChange({
        phone: user.phone,
        action: 'add',
        reason: 'Оплата вступительного взноса',
        userName: uName,
      });
    } else {
      // 2. Стандартная логика смены статуса (заморозка / разморозка)
      if (data.status && data.status !== user.status) {
        if (data.status === 'frozen') {
          user.status = 'frozen';
          user.frozenAt = now;
          // Заморозка -> удалить из шлагбаума
          const uName =
            `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
          await logBarrierChange({
            phone: user.phone,
            action: 'remove',
            reason: 'Заморозка аккаунта',
            userName: uName,
          });
        } else if (user.status === 'frozen') {
          // Разморозка в active -> добавить в шлагбаум
          // ... (логика расчета дней) ...
          if (data.status === 'active' || data.status === 'grace') {
            const uName =
              `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
            await logBarrierChange({
              phone: user.phone,
              action: 'add',
              reason: 'Снятие заморозки',
              userName: uName,
            });
          }
        } else if (data.status === 'disabled') {
          const uName =
            `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
          await logBarrierChange({
            phone: user.phone,
            action: 'remove',
            reason: 'Блокировка администратором',
            userName: uName,
          });
        } else if (data.status === 'active' && user.status === 'disabled') {
          const uName =
            `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
          await logBarrierChange({
            phone: user.phone,
            action: 'add',
            reason: 'Активация администратором',
            userName: uName,
          });
        } else {
          user.status = data.status;
        }
      }

      // Обновляем дату вручную, только если статус не заморожен и дата передана
      if (data.paidUntil && user.status !== 'frozen') {
        const parsedDate = new Date(data.paidUntil);
        if (!isNaN(parsedDate.getTime())) {
          user.paidUntil = parsedDate;
        }
      }
    }

    // 3. Обновляем основные поля (телефон, ФИО, адрес)
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

    // 4. Обновляем данные автомобиля
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
