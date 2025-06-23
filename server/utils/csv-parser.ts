import * as iconv from 'iconv-lite';

interface ImportProduct {
  name?: string;
  sku?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  price?: string;
  originalPrice?: string;
  imageUrl?: string | null;
  stock?: number;
  categoryId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  tag?: string | null;
  categoryName?: string;
}

/**
 * Специализированный парсер для CSV файлов pittools.ru
 */
export function parsePittoolsCsv(content: string): ImportProduct[] {
  const lines = content.split('\n');
  const products: ImportProduct[] = [];
  
  if (lines.length < 2) {
    throw new Error('CSV файл пустой или содержит только заголовки');
  }

  // Извлекаем заголовки
  const headers = lines[0].split(';').map(h => h.trim());
  console.log(`Найдено заголовков: ${headers.length}`);

  let validProductsCount = 0;
  let currentRecord = '';
  let insideQuotes = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Подсчитываем количество кавычек для определения многострочных записей
    const quoteCount = (line.match(/"/g) || []).length;
    
    if (!insideQuotes) {
      // Начинаем новую запись
      currentRecord = line;
      
      // Проверяем, начинается ли многострочная запись
      if (quoteCount % 2 === 1) {
        insideQuotes = true;
        continue;
      }
    } else {
      // Продолжаем многострочную запись
      currentRecord += ' ' + line;
      
      // Проверяем, заканчивается ли многострочная запись
      if (quoteCount % 2 === 1) {
        insideQuotes = false;
      } else {
        continue;
      }
    }

    // Обрабатываем завершенную запись
    if (!insideQuotes && currentRecord.trim()) {
      const fields = currentRecord.split(';');
      
      // Пропускаем записи с недостаточным количеством полей
      if (fields.length < 7) {
        continue;
      }

      const imageUrl = fields[0]?.trim().replace(/^"|"$/g, '') || '';
      const name = fields[1]?.trim().replace(/^"|"$/g, '') || '';
      const sku = fields[2]?.trim().replace(/^"|"$/g, '') || '';
      const priceStr = fields[3]?.trim().replace(/^"|"$/g, '') || '';
      const currency = fields[4]?.trim().replace(/^"|"$/g, '') || '';
      const availability = fields[5]?.trim().replace(/^"|"$/g, '') || '';
      const categoryName = fields[6]?.trim().replace(/^"|"$/g, '') || '';
      const subcategoryName = fields[7]?.trim().replace(/^"|"$/g, '') || '';
      const section = fields[8]?.trim().replace(/^"|"$/g, '') || '';
      const url = fields[9]?.trim().replace(/^"|"$/g, '') || '';
      const description = fields[10]?.trim().replace(/^"|"$/g, '') || '';

      // Валидация обязательных полей
      if (!name || !sku || !categoryName || name.length < 3) {
        continue;
      }

      // Парсинг цены
      const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
      const price = parseFloat(cleanPrice);
      
      if (isNaN(price) || price <= 0) {
        continue;
      }

      const product: ImportProduct = {
        name: name,
        sku: sku,
        slug: generateProductSlug(name + '-' + sku),
        price: price.toString(),
        categoryName: categoryName,
        description: cleanHtmlDescription(description),
        shortDescription: subcategoryName || section || null,
        imageUrl: imageUrl || null,
        isActive: availability === 'Да' || availability === 'В наличии',
        tag: section || null
      };

      products.push(product);
      validProductsCount++;

      if (validProductsCount % 100 === 0) {
        console.log(`Обработано товаров: ${validProductsCount}`);
      }

      // Ограничиваем количество для тестирования
      if (validProductsCount >= 1000) {
        console.log('Достигнут лимит 1000 товаров для тестирования');
        break;
      }
    }
  }

  console.log(`Успешно обработано товаров: ${validProductsCount}`);
  
  if (validProductsCount === 0) {
    throw new Error('Не найдено валидных товаров в CSV файле');
  }

  return products;
}

/**
 * Генерирует slug для товара
 */
function generateProductSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Очищает HTML описание товара
 */
function cleanHtmlDescription(description: string): string {
  if (!description) return '';
  
  return description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n**')
    .replace(/<\/h[1-6]>/gi, '**\n\n')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 2000);
}