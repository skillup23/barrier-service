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
    const oldStatus = user.status;
    const uName =
      `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();

    // 1. Проверяем установку вступительного взноса
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

      // В очередь на добавление пишем, если он был отключён от шлагбаума (disabled или frozen)
      if (oldStatus === 'disabled' || oldStatus === 'frozen') {
        await logBarrierChange({
          phone: user.phone,
          action: 'add',
          reason: 'Оплата вступительного взноса (активация)',
          userName: uName,
        });
      }
    } else {
      // 2. Логика смены статусов и отправки в SMS-очередь
      if (data.status && data.status !== user.status) {
        // --- ПЕРЕХОД В ЗАМОРОЗКУ ---
        if (data.status === 'frozen') {
          user.status = 'frozen';
          user.frozenAt = now;

          // Если до этого он был активен/в грейсе, то удаляем из шлагбаума
          if (oldStatus === 'active' || oldStatus === 'grace') {
            await logBarrierChange({
              phone: user.phone,
              action: 'remove',
              reason: 'Заморозка доступа (отпуск/пауза)',
              userName: uName,
            });
          }

          // --- ВЫХОД ИЗ ЗАМОРОЗКИ ---
        } else if (oldStatus === 'frozen') {
          // Компенсируем дни, которые пользователь провёл в заморозке
          if (user.frozenAt) {
            const frozenDate = new Date(user.frozenAt);
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

          // Если разморозили в active или grace — возвращаем номер в шлагбаум
          if (data.status === 'active' || data.status === 'grace') {
            await logBarrierChange({
              phone: user.phone,
              action: 'add',
              reason: 'Разморозка (доступ восстановлен)',
              userName: uName,
            });
          }

          // --- БЛОКИРОВКА ---
        } else if (data.status === 'disabled') {
          user.status = 'disabled';

          // Удаляем из шлагбаума, если до этого был доступ
          if (oldStatus === 'active' || oldStatus === 'grace') {
            await logBarrierChange({
              phone: user.phone,
              action: 'remove',
              reason: 'Блокировка администратором',
              userName: uName,
            });
          }

          // --- АКТИВАЦИЯ ИЗ БЛОКИРОВКИ ---
        } else if (
          (data.status === 'active' || data.status === 'grace') &&
          oldStatus === 'disabled'
        ) {
          user.status = data.status;
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

      // Обновляем дату вручную, если передана и статус не заморожен
      if (data.paidUntil && user.status !== 'frozen') {
        const parsedDate = new Date(data.paidUntil);
        if (!isNaN(parsedDate.getTime())) {
          user.paidUntil = parsedDate;
        }
      }
    }

    // 3. Обновляем основные поля
    if (data.phone) user.phone = data.phone.trim();

    if (data.fullName) {
      user.fullName = {
        lastName: data.fullName.lastName ?? user.fullName?.lastName ?? '',
        firstName: data.fullName.firstName ?? user.fullName?.firstName ?? '',
        middleName: data.fullName.middleName ?? user.fullName?.middleName ?? '',
      };
    }

    if (
      data.address ||
      data.area !== undefined ||
      data.street !== undefined ||
      data.house !== undefined
    ) {
      user.address = {
        area: data.address?.area ?? data.area ?? user.address?.area ?? '',
        street:
          data.address?.street ?? data.street ?? user.address?.street ?? '',
        house: data.address?.house ?? data.house ?? user.address?.house ?? '',
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
