/* eslint-disable @typescript-eslint/no-require-imports */
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const fs = require('fs');

const FILE_PATH = './barrier-users.xlsm';
const SHEET_NAME = 'Лист1';
const BASE_DATE = new Date('2026-09-05T00:00:00.000Z');
const RATE_PER_DAY = 2.5;

function cleanPhone(raw) {
  if (raw === undefined || raw === null) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11) {
    if (digits.startsWith('8') || digits.startsWith('7')) {
      return '+7' + digits.slice(1);
    }
  }
  if (digits.length > 10) return '+' + digits;
  return null;
}

function formatCarModel(val1, val2) {
  const parts = [val1, val2].map((v) => String(v || '').trim()).filter(Boolean);
  return parts.join(' ');
}

function formatCarPlate(series, digits, region) {
  const s = String(series || '')
    .trim()
    .replace(/\s+/g, '');
  const d = String(digits || '')
    .trim()
    .replace(/\s+/g, '');
  const r = String(region || '')
    .trim()
    .replace(/\s+/g, '');

  if (!s && !d && !r) return '';

  if (s.length === 3 && d.length > 0) {
    const firstLetter = s[0];
    const otherLetters = s.slice(1);
    return `${firstLetter}${d}${otherLetters}${r}`.toUpperCase();
  }

  return `${s}${d}${r}`.toUpperCase();
}

async function run() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`Ошибка: Файл "${FILE_PATH}" не найден!`);
    return;
  }

  const workbook = xlsx.readFile(FILE_PATH);
  const worksheet = workbook.Sheets[SHEET_NAME];

  if (!worksheet) {
    console.error(`Ошибка: Лист "${SHEET_NAME}" не найден!`);
    return;
  }

  const rows = xlsx.utils.sheet_to_json(worksheet, {
    header: 'A',
    raw: false,
    defval: '',
  });
  console.log(`Всего строк прочитано из таблицы: ${rows.length}`);

  const phoneMap = new Map();
  const emptyPhoneRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1; // Номер строки в Excel

    const phone = cleanPhone(row['A']);
    if (!phone) {
      emptyPhoneRows.push({
        row: rowNumber,
        fio: `${row['E']} ${row['F']} ${row['G']}`.trim(),
        address: `${row['C']}, д. ${row['D']}`,
      });
      continue;
    }

    const area = String(row['B'] || '').trim();
    const street = String(row['C'] || '').trim();
    const house = String(row['D'] || '').trim();
    const lastName = String(row['E'] || '').trim();
    const firstName = String(row['F'] || '').trim();
    const middleName = String(row['G'] || '').trim();

    const rawBalance = String(row['H'] || '0')
      .replace(/[\s\u00A0]/g, '')
      .replace(',', '.');
    const balance = parseFloat(rawBalance) || 0;

    const carModel = formatCarModel(row['I'], row['J']);
    const carPlate = formatCarPlate(row['K'], row['L'], row['M']);

    if (phoneMap.has(phone)) {
      // Номер уже есть в базе -> добавляем машину в список phones и суммируем баланс
      const existingUser = phoneMap.get(phone);
      existingUser._balance += balance;

      // Добавляем машину, если у этой записи указаны авто или номер
      if (carModel || carPlate) {
        const alreadyHasPlate = existingUser.phones.some(
          (p) => p.carPlate === carPlate && carPlate !== '',
        );
        if (!alreadyHasPlate) {
          existingUser.phones.push({
            phone: phone,
            carPlate: carPlate,
            carModel: carModel,
            _id: { $oid: new ObjectId().toHexString() },
          });
        }
      }
    } else {
      // Новый пользователь
      const last4 = phone.slice(-4);
      const rawPassword = `pass${last4}`;
      const passwordHash = bcrypt.hashSync(rawPassword, 10);

      const userDoc = {
        _id: { $oid: new ObjectId().toHexString() },
        phone: phone,
        passwordHash: passwordHash,
        role: 'user',
        fullName: {
          lastName: lastName,
          firstName: firstName,
          middleName: middleName,
        },
        address: {
          area: area,
          street: street,
          house: house,
        },
        phones: [
          {
            phone: phone,
            carPlate: carPlate,
            carModel: carModel,
            _id: { $oid: new ObjectId().toHexString() },
          },
        ],
        entranceFeePaid: true,
        status: 'blocked',
        paidUntil: { $date: BASE_DATE.toISOString() },
        createdAt: { $date: '2026-09-05T00:00:00.000Z' },
        updatedAt: { $date: '2026-09-05T00:00:00.000Z' },
        __v: 0,
        _balance: balance,
      };

      phoneMap.set(phone, userDoc);
    }
  }

  // Пересчитываем итоговый статус и дату paidUntil по суммарному балансу
  const resultUsers = Array.from(phoneMap.values()).map((user) => {
    let status = 'blocked';
    let paidUntil = new Date(BASE_DATE);

    if (user._balance > 0) {
      status = 'active';
      const days = Math.floor(user._balance / RATE_PER_DAY);
      paidUntil.setDate(paidUntil.getDate() + days);
    }

    user.status = status;
    user.paidUntil = { $date: paidUntil.toISOString() };
    delete user._balance;

    return user;
  });

  fs.writeFileSync(
    './users.json',
    JSON.stringify(resultUsers, null, 2),
    'utf-8',
  );

  console.log(`\nОбработка завершена:`);
  console.log(`- Всего строк в Excel: ${rows.length}`);
  console.log(
    `- Строк без номера телефона (пропущено): ${emptyPhoneRows.length}`,
  );
  if (emptyPhoneRows.length > 0) {
    console.log('  Список пропущенных (нет телефона):', emptyPhoneRows);
  }
  console.log(
    `- Итоговых уникальных пользователей (аккаунтов): ${resultUsers.length}`,
  );
  console.log(`- Данные сохранены в ./users.json`);
}

run().catch(console.error);
