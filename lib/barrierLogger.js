import BarrierQueue from '@/models/BarrierQueue';

/**
 * Логирует изменение доступа жителя к шлагбауму
 * @param {Object} params
 * @param {string} params.phone - номер телефона
 * @param {'add'|'remove'} params.action - действие (add - добавить в шлагбаум, remove - удалить)
 * @param {string} params.reason - причина изменения
 * @param {string} params.userName - ФИО для удобства модератора
 */
export async function logBarrierChange({
  phone,
  action,
  reason,
  userName = '',
}) {
  if (!phone) return;

  // Нормализуем номер к виду +7XXXXXXXXXX
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7') && digits.length === 10) digits = '7' + digits;
  const cleanPhone = digits.length === 11 ? `+${digits}` : phone.trim();

  try {
    // Проверяем, нет ли уже необработанной записи для этого телефона
    const existing = await BarrierQueue.findOne({
      phone: cleanPhone,
      isProcessed: false,
    });

    if (existing) {
      if (existing.action === action) {
        // Действие то же самое — просто обновляем причину и дату
        existing.reason = reason;
        if (userName) existing.userName = userName;
        await existing.save();
        return;
      } else {
        // Действие противоположное (например, было remove, стало add)
        // Обновляем на актуальное новое действие
        existing.action = action;
        existing.reason = reason;
        if (userName) existing.userName = userName;
        await existing.save();
        return;
      }
    }

    // Создаем новую запись в очереди
    await BarrierQueue.create({
      phone: cleanPhone,
      action,
      reason,
      userName,
      isProcessed: false,
    });
  } catch (error) {
    console.error('Ошибка записи в BarrierQueue:', error);
  }
}
