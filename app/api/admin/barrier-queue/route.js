import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import BarrierQueue from '@/models/BarrierQueue';

// GET: Получение всех необработанных изменений
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();

    const pendingLogs = await BarrierQueue.find({ isProcessed: false }).sort({
      createdAt: -1,
    });

    const toAdd = pendingLogs.filter((item) => item.action === 'add');
    const toRemove = pendingLogs.filter((item) => item.action === 'remove');

    const addPhonesString = toAdd.map((item) => item.phone).join(', ');
    const removePhonesString = toRemove.map((item) => item.phone).join(', ');

    return NextResponse.json({
      success: true,
      queue: pendingLogs,
      summary: {
        toAdd,
        toRemove,
        addPhonesString,
        removePhonesString,
        totalPending: pendingLogs.length,
      },
    });
  } catch (error) {
    console.error('Ошибка получения очереди шлагбаума:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST: Отметить записи как отправленные в шлагбаум
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();

    // Помечаем все текущие записи как обработанные
    await BarrierQueue.updateMany(
      { isProcessed: false },
      { $set: { isProcessed: true } },
    );

    return NextResponse.json({
      success: true,
      message: 'Все изменения отмечены как отправленные в шлагбаум',
    });
  } catch (error) {
    console.error('Ошибка очистки очереди:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить статус' },
      { status: 500 },
    );
  }
}
