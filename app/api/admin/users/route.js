import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await req.json();
    const phone = body.phone?.trim();
    const password = body.password?.trim();

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Телефон и пароль обязательны' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким телефоном уже существует' },
        { status: 400 },
      );
    }

    // Поддержка обоих вариантов: плоских полей и вложенных объектов
    const area = (body.area ?? body.address?.area ?? '').trim();
    const street = (body.street ?? body.address?.street ?? '').trim();
    const house = (body.house ?? body.address?.house ?? '').trim();

    const lastName = (body.lastName ?? body.fullName?.lastName ?? '').trim();
    const firstName = (body.firstName ?? body.fullName?.firstName ?? '').trim();
    const middleName = (
      body.middleName ??
      body.fullName?.middleName ??
      ''
    ).trim();

    const carPlate = (body.carPlate ?? '').trim();
    const carModel = (body.carModel ?? '').trim();
    const entranceFeePaid = Boolean(body.entranceFeePaid);

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    let paidUntil = new Date(now);
    let status = 'active';

    if (entranceFeePaid) {
      // Оплачен вступительный взнос -> 1 день пользования
      paidUntil.setDate(paidUntil.getDate() + 1);
      status = 'active';
    } else {
      // Без вступительного взноса -> минус 700 руб. (280 дней при тарифе 2.5 руб/день)
      const debtDays = Math.round(700 / 2.5);
      paidUntil.setDate(paidUntil.getDate() - debtDays);
      status = 'disabled';
    }

    const newUser = new User({
      phone,
      passwordHash,
      role: 'user',
      fullName: {
        lastName,
        firstName,
        middleName,
      },
      address: {
        area: area || 'Не указан',
        street: street || 'Не указана',
        house: house || 'Не указан',
      },
      phones: [
        {
          phone,
          carPlate,
          carModel,
        },
      ],
      entranceFeePaid,
      status,
      paidUntil,
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      message: 'Житель успешно добавлен',
      user: newUser,
    });
  } catch (error) {
    console.error('Ошибка добавления жителя:', error);
    return NextResponse.json(
      { error: error.message || 'Не удалось добавить жителя' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.['role'] !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
