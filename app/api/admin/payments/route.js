import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';

// GET: Получение всех чеков (с фильтрацией по статусу)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();

    // Получаем платежи вместе с данными жильца (phone, fullName, address)
    const payments = await Payment.find()
      .populate('userId', 'phone fullName address status paidUntil')
      .sort({ createdAt: -1 });

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Ошибка загрузки платежей' },
      { status: 500 },
    );
  }
}

// POST: Модерация платежа (Принять / Отклонить)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { paymentId, action, rejectionReason, lastPaymentDate } =
      await req.json();

    if (!paymentId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 });
    }

    payment.status = action;
    payment.processedAt = new Date();

    if (action === 'approved') {
      payment.rejectionReason = '';
      payment.lastPaymentDate = lastPaymentDate
        ? new Date(lastPaymentDate)
        : new Date();

      // Автоматический пересчет подписки у Жителя
      const user = await User.findById(payment.userId);
      if (user) {
        // Расчет количества оплаченных месяцев (из расчета 75р / месяц за 1 номер)
        // Если это вступительный взнос (700р), учитываем его логику
        const monthlyRate = 75;
        let addedDays = 30; // Базово 1 месяц

        if (payment.amount >= monthlyRate && !payment.isEntranceFee) {
          const months = Math.floor(payment.amount / monthlyRate);
          addedDays = months * 30;
        }

        const currentDate = new Date();
        const oldPaidUntil = user.paidUntil
          ? new Date(user.paidUntil)
          : currentDate;
        let newPaidUntil;

        // ПУНКТ 5: Расчет даты
        if (user.status === 'disabled') {
          // Если заблокирован: вычитаем 7 дней грейс-периода и отсчитываем от СЕГОДНЯ
          const effectiveDays = Math.max(0, addedDays - 7);
          newPaidUntil = new Date(currentDate);
          newPaidUntil.setDate(newPaidUntil.getDate() + effectiveDays);
        } else {
          // Если active или grace: прибавляем дни строго к СТАРОЙ дате paidUntil
          newPaidUntil = new Date(oldPaidUntil);
          newPaidUntil.setDate(newPaidUntil.getDate() + addedDays);
        }

        user.paidUntil = newPaidUntil;
        user.status = 'active';
        if (payment.isEntranceFee) {
          user.entranceFeePaid = true;
        }
        await user.save();
      }
    } else if (action === 'rejected') {
      payment.rejectionReason = rejectionReason || 'Неверный чек';
    }

    await payment.save();
    return NextResponse.json({
      success: true,
      message: `Платёж успешно ${action === 'approved' ? 'одобрен' : 'отклонен'}`,
    });
  } catch (error) {
    console.error('Ошибка модерации:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка обработки' },
      { status: 500 },
    );
  }
}
