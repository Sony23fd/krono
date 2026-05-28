import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('data.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

const data = rawData.map(row => {
  const newRow: any = {};
  for (const key in row) {
    const newKey = key.replace(/\u00A0/g, ' ').trim();
    newRow[newKey] = typeof row[key] === 'string' ? row[key].replace(/\u00A0/g, ' ').trim() : row[key];
  }
  return newRow;
});

let currentCategory = '';
const categories = new Map<string, number>();

for (const row of data) {
  if (row['Код'] === 'Бүлэг:') {
    currentCategory = row['Материалын нэр'];
    if (!categories.has(currentCategory)) {
      categories.set(currentCategory, 0);
    }
  } else if (currentCategory && row['Код']) {
    categories.set(currentCategory, categories.get(currentCategory)! + 1);
  }
}

console.log('Categories found:');
let totalProducts = 0;
for (const [cat, count] of categories.entries()) {
  console.log(`- ${cat}: ${count} products`);
  totalProducts += count;
}
console.log(`Total products mapped: ${totalProducts}`);
