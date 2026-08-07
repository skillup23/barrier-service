import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { uploadToS3 } from '@/lib/s3';

export async function POST(req) {
  try {
    // 1. Проверяем авторизацию
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 },
      );
    }

    const userId = session.user?.['id'];

    // 2. Получаем данные из формы (FormData)
    const formData = await req.formData();
    const file = formData.get('file');
    const amount = Number(formData.get('amount'));
    const isEntranceFee = formData.get('isEntranceFee') === 'true';

    if (!file || !amount) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 },
      );
    }

    // 3. Валидация файла (не более 5 МБ, только PDF и изображения)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Допустимы только файлы PDF, JPG или PNG' },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 5 МБ' },
        { status: 400 },
      );
    }

    // 4. Подготавливаем файл к отправке в S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const cleanPhone = session.user?.['phone'] || 'user';
    const fileName = `receipts/${Date.now()}_${cleanPhone}.${fileExtension}`;

    // Загружаем в Timeweb S3
    const receiptUrl = await uploadToS3(buffer, fileName, file.type);

    // 5. Сохраняем информацию о платеже в MongoDB
    await connectToDatabase();

    const payment = await Payment.create({
      userId,
      amount,
      receiptUrl,
      isEntranceFee,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Чек успешно отправлен на проверку модератору',
      payment,
    });
  } catch (error) {
    console.error('Ошибка при загрузке чека:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить чек' },
      { status: 500 },
    );
  }
}
