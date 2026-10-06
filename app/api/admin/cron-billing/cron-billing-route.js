import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import { logBarrierChange } from '@/lib/barrierLogger';
import User from '@/models/User';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();

    // Сегодняшний день строго с 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.find({ role: 'user' });
    const bulkOps = [];
    let updatedGrace = 0;
    let updatedDisabled = 0;
    let updatedActive = 0;

    for (const user of users) {
      // Замороженных пользователей биллинг не трогает
      if (user.status === 'frozen') {
        continue;
      }

      // 1. Если даты нет вовсе — блокируем
      if (!user.paidUntil) {
        if (user.status !== 'disabled') {
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { status: 'disabled' } },
            },
          });
          updatedDisabled++;

          const uName =
            `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
          await logBarrierChange({
            phone: user.phone,
            action: 'remove',
            reason: 'Отсутствует дата оплаты',
            userName: uName,
          });
        }
        continue;
      }

      // 2. Безопасный парсинг даты
      const paidDate = new Date(user.paidUntil);
      if (isNaN(paidDate.getTime())) {
        if (user.status !== 'disabled') {
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { status: 'disabled' } },
            },
          });
          updatedDisabled++;

          const uName =
            `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();
          await logBarrierChange({
            phone: user.phone,
            action: 'remove',
            reason: 'Некорректная дата оплаты',
            userName: uName,
          });
        }
        continue;
      }

      paidDate.setHours(0, 0, 0, 0);

      // Разница в календарных днях
      const diffTime = today.getTime() - paidDate.getTime();
      const overdueDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let newStatus = user.status;

      if (overdueDays >= 1 && overdueDays <= 7) {
        newStatus = 'grace';
      } else if (overdueDays > 7) {
        newStatus = 'disabled';
      } else {
        newStatus = 'active';
      }

      // Если статус изменился
      if (newStatus !== user.status) {
        const oldStatus = user.status;

        bulkOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: { status: newStatus } },
          },
        });

        const uName =
          `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim();

        if (newStatus === 'grace') {
          updatedGrace++;
          // Если он был заблокирован, а стал grace (например, вручную продлили срок),
          // то ему снова разрешен проезд -> отправляем 'add'
          if (oldStatus === 'disabled') {
            await logBarrierChange({
              phone: user.phone,
              action: 'add',
              reason: 'Восстановление доступа (в льготном периоде)',
              userName: uName,
            });
          }
        } else if (newStatus === 'disabled') {
          updatedDisabled++;
          // Блокировка -> удаляем из базы шлагбаума
          await logBarrierChange({
            phone: user.phone,
            action: 'remove',
            reason: `Задолженность (${overdueDays} дн.)`,
            userName: uName,
          });
        } else if (newStatus === 'active') {
          updatedActive++;
          // Если он ДО этого был заблокирован, а теперь стал active -> добавляем в шлагбаум
          if (oldStatus === 'disabled') {
            await logBarrierChange({
              phone: user.phone,
              action: 'add',
              reason: 'Продление срока оплаты (активирован)',
              userName: uName,
            });
          }
        }
      }
    }

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      message: `Проверка завершена. В Grace-период: ${updatedGrace}, Заблокировано: ${updatedDisabled}, Активировано: ${updatedActive}`,
    });
  } catch (error) {
    console.error('Критическая ошибка cron-billing:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при выполнении биллинга' },
      { status: 500 },
    );
  }
}
