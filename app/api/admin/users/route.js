import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET: Список всех пользователей для модератора
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({ role: 'user' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка загрузки пользователей' },
      { status: 500 },
    );
  }
}

// POST: Добавление нового жителя модератором
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const {
      phone,
      password,
      lastName,
      firstName,
      middleName,
      area,
      street,
      house,
      carPlate,
      carModel,
      entranceFeePaid,
    } = await req.json();

    if (!phone || !password || !area || !street || !house) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля (Телефон, Пароль, Адрес)' },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером уже существует' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      phone: phone.trim(),
      passwordHash: hashedPassword,
      role: 'user',
      fullName: {
        lastName: lastName || '',
        firstName: firstName || '',
        middleName: middleName || '',
      },
      address: { area, street, house },
      phones: [
        {
          phone: phone.trim(),
          carPlate: carPlate || '',
          carModel: carModel || '',
        },
      ],
      entranceFeePaid: Boolean(entranceFeePaid),
      status: 'active',
      paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // По умолчанию оплачен на 30 дней
    });

    return NextResponse.json({
      success: true,
      message: `Житель ${newUser.phone} успешно добавлен`,
      user: newUser,
    });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    return NextResponse.json(
      { error: 'Не удалось создать пользователя' },
      { status: 500 },
    );
  }
}
