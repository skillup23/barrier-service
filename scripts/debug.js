/* eslint-disable @typescript-eslint/no-require-imports */
const xlsx = require('xlsx');

const workbook = xlsx.readFile('./barrier-users.xlsm');

console.log('Список всех листов в файле:', workbook.SheetNames);

// Смотрим каждый лист
workbook.SheetNames.forEach((name) => {
  const sheet = workbook.Sheets[name];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\nЛист "${name}":`);
  console.log(`- Всего строк: ${rows.length}`);
  console.log('- Пример первых 3 строк:');
  console.dir(rows.slice(0, 3), { depth: null });
});
