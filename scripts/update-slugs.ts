import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function cyrillicToLatinSlug(text: string): string {
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

async function main() {
  const categories = await db.category.findMany();
  for (const cat of categories) {
    const newSlug = cyrillicToLatinSlug(cat.name) || `cat-${cat.id}`;
    if (cat.slug !== newSlug) {
      await db.category.update({
        where: { id: cat.id },
        data: { slug: newSlug }
      });
      console.log(`Updated: ${cat.name} -> ${newSlug}`);
    }
  }
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
