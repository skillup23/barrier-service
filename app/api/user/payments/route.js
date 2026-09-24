import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 },
      );
    }

    const userId = session.user?.['id'];
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя не найден' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Ошибка получения платежей жителя:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить историю платежей' },
      { status: 500 },
    );
  }
}
