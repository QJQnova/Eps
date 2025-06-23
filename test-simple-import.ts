import { readFileSync } from 'fs';
import * as iconv from 'iconv-lite';
import { db } from './server/db';
import { categories, products, type InsertCategory, type InsertProduct } from './shared/schema';
import { eq } from 'drizzle-orm';

interface CSVProduct {
  imageUrl: string;
  name: string;
  sku: string;
  price: string;
  currency: string;
  availability: string;
  category: string;
  subcategory: string;
  section: string;
  url: string;
  description: string;
}

async function testSimpleImport() {
  console.log('🚀 Запуск простого импорта CSV файла...');

  try {
    // Читаем CSV файл с автоопределением кодировки
    const filePath = './attached_assets/3385076--pittools.ru (1)_1750681998818.csv';
    let content: string;

    try {
      // Пробуем Windows-1251
      const buffer = readFileSync(filePath);
      content = iconv.decode(buffer, 'win1251');
      console.log('✅ Файл успешно прочитан в кодировке Windows-1251');
    } catch (error) {
      // Fallback на UTF-8
      content = readFileSync(filePath, 'utf8');
      console.log('✅ Файл прочитан в кодировке UTF-8');
    }

    // Разбиваем на строки
    const lines = content.split('\n').filter(line => line.trim());
    console.log(`📄 Всего строк в файле: ${lines.length}`);

    if (lines.length < 2) {
      throw new Error('Файл пустой или содержит только заголовки');
    }

    // Извлекаем заголовки
    const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
    console.log(`📋 Заголовки: ${headers.join(', ')}`);

    // Обрабатываем первые 10 строк для тестирования
    const productsToImport: InsertProduct[] = [];
    const categoriesToCreate = new Set<string>();

    let processedCount = 0;
    let validCount = 0;

    for (let i = 1; i < Math.min(lines.length, 21); i++) {
      const line = lines[i];
      processedCount++;

      // Простое разделение по точке с запятой
      const fields = line.split(';').map(f => f.trim().replace(/^"|"$/g, ''));
      
      if (fields.length < 7) {
        console.log(`⚠️ Строка ${i}: недостаточно полей (${fields.length})`);
        continue;
      }

      const imageUrl = fields[0] || '';
      const name = fields[1] || '';
      const sku = fields[2] || '';
      const priceStr = fields[3] || '';
      const currency = fields[4] || '';
      const availability = fields[5] || '';
      const categoryName = fields[6] || '';

      // Валидация обязательных полей
      if (!name || !sku || !categoryName || name.length < 3) {
        console.log(`⚠️ Строка ${i}: пропущены обязательные поля`);
        continue;
      }

      // Парсинг цены
      const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
      const price = parseFloat(cleanPrice);
      
      if (isNaN(price) || price <= 0) {
        console.log(`⚠️ Строка ${i}: некорректная цена "${priceStr}"`);
        continue;
      }

      // Добавляем категорию в множество для создания
      categoriesToCreate.add(categoryName);

      // Создаем товар
      const product: InsertProduct = {
        name: name,
        sku: sku,
        slug: generateSlug(name + '-' + sku),
        price: price.toString(),
        categoryName: categoryName,
        description: fields[10] || null,
        imageUrl: imageUrl || null,
        isActive: availability === 'Да' || availability === 'В наличии',
        stock: availability === 'Да' ? 10 : 0
      };

      productsToImport.push(product);
      validCount++;

      console.log(`✅ Товар ${validCount}: ${name} (${sku}) - ${price} руб.`);
    }

    console.log(`📊 Обработано строк: ${processedCount}, валидных товаров: ${validCount}`);

    if (validCount === 0) {
      throw new Error('Не найдено валидных товаров для импорта');
    }

    // Создаем категории
    console.log('🏗️ Создание категорий...');
    const categoryMap = new Map<string, number>();

    for (const categoryName of categoriesToCreate) {
      try {
        const newCategory: InsertCategory = {
          name: categoryName,
          slug: generateSlug(categoryName),
          description: `Категория товаров: ${categoryName}`
        };

        const [category] = await db.insert(categories).values(newCategory).returning();
        categoryMap.set(categoryName, category.id);
        console.log(`✅ Категория создана: ${categoryName} (ID: ${category.id})`);
      } catch (error: any) {
        console.error(`❌ Ошибка создания категории ${categoryName}:`, error.message);
      }
    }

    // Импортируем товары
    console.log('📦 Импорт товаров...');
    let importedCount = 0;

    for (const product of productsToImport) {
      try {
        // Получаем ID категории
        const categoryId = categoryMap.get(product.categoryName || '');
        if (!categoryId) {
          console.log(`⚠️ Пропуск товара: категория не найдена для ${product.name}`);
          continue;
        }

        const productToInsert: InsertProduct = {
          ...product,
          categoryId: categoryId
        };

        const [insertedProduct] = await db.insert(products).values(productToInsert).returning();
        importedCount++;
        console.log(`✅ Товар импортирован: ${insertedProduct.name} (ID: ${insertedProduct.id})`);
      } catch (error: any) {
        console.error(`❌ Ошибка импорта товара ${product.name}:`, error.message);
      }
    }

    console.log(`🎉 Импорт завершен! Создано категорий: ${categoryMap.size}, импортировано товаров: ${importedCount}`);

  } catch (error: any) {
    console.error('❌ Ошибка импорта:', error.message);
    throw error;
  }
}

function generateSlug(text: string): string {
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

// Запускаем импорт если файл вызван напрямую
if (require.main === module) {
  testSimpleImport()
    .then(() => {
      console.log('✅ Тест импорта завершен успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Тест импорта завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { testSimpleImport };