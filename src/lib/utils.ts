import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

export function getUpcomingDeliveryDates(scheduleDaysStr: string, count: number = 2): { date: Date, formatted: string }[] {
  if (!scheduleDaysStr) scheduleDaysStr = "3,6";
  const allowedDays = scheduleDaysStr.split(",").map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6);
  if (allowedDays.length === 0) allowedDays.push(3, 6);

  allowedDays.sort((a, b) => a - b);
  
  const results = [];
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Start from tomorrow
  currentDate.setDate(currentDate.getDate() + 1);

  let daysChecked = 0;
  while (results.length < count && daysChecked < 30) {
    const dayOfWeek = currentDate.getDay();
    if (allowedDays.includes(dayOfWeek)) {
      const mnDateStr = `${currentDate.getMonth() + 1} сарын ${currentDate.getDate()}, ${DAY_NAMES[dayOfWeek]}`;
      results.push({
        date: new Date(currentDate), // Keep exact Date
        formatted: mnDateStr
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }
  
  return results;
}

export function cyrillicToLatinSlug(text: string): string {
  const cyrillicToLatinMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j', 'з': 'z',
    'и': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'ө': 'u', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ү': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'yo', 'Ж': 'j', 'З': 'z',
    'И': 'i', 'Й': 'i', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n', 'О': 'o', 'Ө': 'u', 'П': 'p',
    'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u', 'Ү': 'u', 'Ф': 'f', 'Х': 'h', 'Ц': 'ts', 'Ч': 'ch',
    'Ш': 'sh', 'Щ': 'sh', 'Ъ': '', 'Ы': 'y', 'Ь': '', 'Э': 'e', 'Ю': 'yu', 'Я': 'ya'
  };

  const transliterated = text.split('').map(char => cyrillicToLatinMap[char] ?? char).join('');
  
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}
