import { storage } from './server/storage';
import { readFileSync } from 'fs';
import type { InsertProduct, InsertCategory } from './shared/schema';

async function simpleCsvTest() {
  console.log('Начинаю тестовый импорт нового CSV файла...');
  
  try {
    const csvContent = readFileSync('./latest-pittools-catalog.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`Общее количество строк: ${lines.length}`);
    
    // Анализ заголовков
    const headers = lines[0].split(';');
    console.log(`Колонок в CSV: ${headers.length}`);
    console.log('Первые 10 заголовков:', headers.slice(0, 10));
    
    const dataLines = lines.slice(1);
    let productCount = 0;
    let categoryCount = 0;
    let errorCount = 0;
    
    const categories = new Map<string, number>();
    
    // Обрабатываем первые 10 строк для тестирования
    for (let i = 0; i < Math.min(dataLines.length, 10); i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      
      const parts = line.split(';');
      
      if (parts.length < 7) {
        console.log(`Строка ${i + 2}: недостаточно данных (${parts.length} колонок)`);
        errorCount++;
        continue;
      }
      
      const imageUrl = parts[0]?.trim();
      const name = parts[1]?.trim();
      const sku = parts[2]?.trim();
      const priceStr = parts[3]?.trim();
      const currency = parts[4]?.trim();
      const inStock = parts[5]?.trim();
      const categoryName = parts[6]?.trim();
      
      console.log(`\n--- Строка ${i + 2} ---`);
      console.log(`Название: "${name}"`);
      console.log(`Артикул: "${sku}"`);
      console.log(`Цена: "${priceStr}" ${currency}`);
      console.log(`Категория: "${categoryName}"`);
      console.log(`Наличие: "${inStock}"`);
      
      if (!name || !sku || !categoryName) {
        console.log('Пропущено: отсутствуют обязательные поля');
        errorCount++;
        continue;
      }
      
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) {
        console.log(`Пропущено: некорректная цена "${priceStr}"`);
        errorCount++;
        continue;
      }
      
      // Работа с категорией
      let categoryId = categories.get(categoryName);
      if (!categoryId) {
        try {
          const existingCategory = await storage.getCategoryByName(categoryName);
          if (existingCategory) {
            categoryId = existingCategory.id;
            console.log(`Найдена существующая категория: ${categoryName} (ID: ${categoryId})`);
          } else {
            const newCategory: InsertCategory = {
              name: categoryName,
              slug: generateSlug(categoryName),
              description: null,
              icon: null
            };
            
            const category = await storage.createCategory(newCategory);
            categoryId = category.id;
            categoryCount++;
            console.log(`Создана новая категория: ${categoryName} (ID: ${categoryId})`);
          }
          categories.set(categoryName, categoryId);
        } catch (error) {
          console.log(`Ошибка категории: ${error}`);
          errorCount++;
          continue;
        }
      }
      
      // Создание товара
      const insertProduct: InsertProduct = {
        sku,
        name: name,
        slug: generateSlug(name + '-' + sku),
        description: null,
        shortDescription: null,
        price: price.toString(),
        originalPrice: null,
        imageUrl: imageUrl || null,
        categoryId: categoryId,
        isActive: inStock === 'Да',
        tag: null
      };
      
      try {
        await storage.createProduct(insertProduct);
        productCount++;
        console.log(`✅ Товар создан успешно`);
      } catch (error: any) {
        if (error.message.includes('duplicate key')) {
          console.log(`Товар уже существует: ${sku}`);
        } else {
          console.log(`Ошибка создания товара: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n=== РЕЗУЛЬТАТЫ ТЕСТОВОГО ИМПОРТА ===`);
    console.log(`Новых товаров: ${productCount}`);
    console.log(`Новых категорий: ${categoryCount}`);
    console.log(`Ошибок: ${errorCount}`);
    
  } catch (error) {
    console.error('Критическая ошибка:', error);
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

simpleCsvTest().catch(console.error);