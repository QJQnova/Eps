const XLSX = require('xlsx');
import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq } from 'drizzle-orm';
import type { InsertCategory, InsertProduct } from './shared/schema';

interface ExcelProduct {
  [key: string]: any;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanText(text: any): string {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ');
}

function extractPrice(priceText: any): string {
  if (!priceText) return '0';
  const cleanPrice = String(priceText).replace(/[^\d.,]/g, '');
  return cleanPrice || '0';
}

async function createCategoryIfNotExists(categoryName: string): Promise<number> {
  if (!categoryName || categoryName.trim().length < 2) {
    categoryName = 'Общие товары';
  }

  const cleanName = cleanText(categoryName);
  
  // Проверяем существующую категорию
  const existing = await db.select()
    .from(categories)
    .where(eq(categories.name, cleanName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Создаем новую категорию
  const slug = generateSlug(cleanName);
  let finalSlug = slug;
  let counter = 1;

  // Проверяем уникальность slug
  while (true) {
    const existingSlug = await db.select()
      .from(categories)
      .where(eq(categories.slug, finalSlug))
      .limit(1);

    if (existingSlug.length === 0) break;
    
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const newCategory: InsertCategory = {
    name: cleanName,
    slug: finalSlug,
    description: `Категория ${cleanName}`,
    icon: 'tool'
  };

  const result = await db.insert(categories).values(newCategory).returning();
  return result[0].id;
}

async function importExcelProducts() {
  try {
    console.log('Начинаем импорт товаров из Excel файла...');

    // Читаем Excel файл
    const workbook = XLSX.readFile('./attached_assets/Prai_774_s_list_DCK_19_06_25_1751376010729.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертируем в JSON
    const jsonData: ExcelProduct[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Найдено ${jsonData.length} строк в файле`);
    console.log('Пример первой строки:', jsonData[0]);

    // Определяем колонки (может быть разные названия)
    const firstRow = jsonData[0];
    const columnNames = Object.keys(firstRow);
    console.log('Доступные колонки:', columnNames);

    // Попытаемся определить нужные колонки автоматически
    let nameColumn = '';
    let priceColumn = '';
    let categoryColumn = '';
    let descriptionColumn = '';
    let skuColumn = '';

    for (const col of columnNames) {
      const lowerCol = col.toLowerCase();
      
      if (lowerCol.includes('наименование') || lowerCol.includes('название') || lowerCol.includes('товар') || lowerCol.includes('продукт') || lowerCol.includes('name')) {
        nameColumn = col;
      }
      if (lowerCol.includes('цена') || lowerCol.includes('стоимость') || lowerCol.includes('price') || lowerCol.includes('руб')) {
        priceColumn = col;
      }
      if (lowerCol.includes('категория') || lowerCol.includes('группа') || lowerCol.includes('раздел') || lowerCol.includes('category')) {
        categoryColumn = col;
      }
      if (lowerCol.includes('описание') || lowerCol.includes('характеристики') || lowerCol.includes('description')) {
        descriptionColumn = col;
      }
      if (lowerCol.includes('артикул') || lowerCol.includes('код') || lowerCol.includes('sku') || lowerCol.includes('арт')) {
        skuColumn = col;
      }
    }

    console.log('Определенные колонки:');
    console.log('- Название:', nameColumn);
    console.log('- Цена:', priceColumn);
    console.log('- Категория:', categoryColumn);
    console.log('- Описание:', descriptionColumn);
    console.log('- Артикул:', skuColumn);

    let imported = 0;
    let skipped = 0;
    let categoryCache = new Map<string, number>();

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Извлекаем данные из строки
        const name = cleanText(row[nameColumn] || row['Наименование'] || row['Название'] || `Товар ${i + 1}`);
        const price = extractPrice(row[priceColumn] || row['Цена'] || row['Стоимость'] || '0');
        const categoryName = cleanText(row[categoryColumn] || row['Категория'] || row['Группа'] || 'Общие товары');
        const description = cleanText(row[descriptionColumn] || row['Описание'] || '');
        const sku = cleanText(row[skuColumn] || row['Артикул'] || row['Код'] || `SKU-${Date.now()}-${i}`);

        // Пропускаем пустые строки
        if (!name || name.length < 2) {
          skipped++;
          continue;
        }

        // Получаем ID категории (используем кэш для оптимизации)
        let categoryId: number;
        if (categoryCache.has(categoryName)) {
          categoryId = categoryCache.get(categoryName)!;
        } else {
          categoryId = await createCategoryIfNotExists(categoryName);
          categoryCache.set(categoryName, categoryId);
        }

        // Создаем уникальный slug для продукта
        let baseSlug = generateSlug(name);
        if (!baseSlug) baseSlug = `product-${Date.now()}-${i}`;

        let finalSlug = baseSlug;
        let slugCounter = 1;

        // Проверяем уникальность slug продукта
        while (true) {
          const existingProduct = await db.select()
            .from(products)
            .where(eq(products.slug, finalSlug))
            .limit(1);

          if (existingProduct.length === 0) break;
          
          finalSlug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // Создаем товар
        const productData: InsertProduct = {
          sku: sku,
          name: name,
          slug: finalSlug,
          description: description || `Товар ${name}`,
          shortDescription: description ? description.substring(0, 200) : `Товар ${name}`,
          price: price,
          originalPrice: null,
          imageUrl: null,
          stock: null,
          categoryId: categoryId,
          isActive: true,
          isFeatured: false,
          tag: 'imported-excel'
        };

        await db.insert(products).values(productData);
        imported++;

        if (imported % 10 === 0) {
          console.log(`Импортировано ${imported} товаров...`);
        }

      } catch (error) {
        console.error(`Ошибка при обработке строки ${i + 1}:`, error);
        skipped++;
      }
    }

    console.log(`\n=== РЕЗУЛЬТАТЫ ИМПОРТА ===`);
    console.log(`Импортировано товаров: ${imported}`);
    console.log(`Пропущено строк: ${skipped}`);
    console.log(`Создано категорий: ${categoryCache.size}`);
    console.log(`Всего обработано строк: ${jsonData.length}`);

    return {
      imported,
      skipped,
      categoriesCreated: categoryCache.size,
      total: jsonData.length
    };

  } catch (error) {
    console.error('Критическая ошибка при импорте:', error);
    throw error;
  }
}

// Запускаем импорт
importExcelProducts()
  .then(result => {
    console.log('\n✅ Импорт завершен успешно!');
    console.log('Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Ошибка импорта:', error);
    process.exit(1);
  });