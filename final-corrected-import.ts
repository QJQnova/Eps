import { storage } from './server/storage';
import { readFileSync } from 'fs';
import type { InsertProduct, InsertCategory } from './shared/schema';

async function finalCorrectedImport() {
  console.log('Начинаю финальный импорт каталога pittools.ru с корректной кодировкой...');
  
  try {
    const csvContent = readFileSync('./corrected-pittools-catalog.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`Общее количество строк: ${lines.length}`);
    const dataLines = lines.slice(1);
    console.log(`Строк данных для обработки: ${dataLines.length}`);
    
    const categories = new Map<string, number>();
    const processedSKUs = new Set<string>();
    let productCount = 0;
    let categoryCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      
      try {
        const parts = line.split(';');
        
        if (parts.length < 11) {
          errorCount++;
          continue;
        }
        
        const imageUrl = parts[0]?.trim() || '';
        const name = parts[1]?.trim() || '';
        const sku = parts[2]?.trim() || '';
        const priceStr = parts[3]?.trim() || '';
        const currency = parts[4]?.trim() || '';
        const inStock = parts[5]?.trim() || '';
        const categoryName = parts[6]?.trim() || '';
        const subcategoryName = parts[7]?.trim() || '';
        const section = parts[8]?.trim() || '';
        const productUrl = parts[9]?.trim() || '';
        const description = parts[10]?.trim().replace(/^"|"$/g, '') || '';
        
        // Валидация основных полей
        if (!name || !sku || !categoryName || !priceStr) {
          skippedCount++;
          continue;
        }
        
        // Проверка дубликатов
        if (processedSKUs.has(sku)) {
          skippedCount++;
          continue;
        }
        
        processedSKUs.add(sku);
        
        // Парсинг цены
        const cleanPriceStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const price = parseFloat(cleanPriceStr);
        
        if (isNaN(price) || price <= 0) {
          errorCount++;
          continue;
        }
        
        // Создание или получение категории
        let categoryId = categories.get(categoryName);
        if (!categoryId) {
          try {
            const existingCategory = await storage.getCategoryByName(categoryName);
            if (existingCategory) {
              categoryId = existingCategory.id;
              categories.set(categoryName, categoryId);
            } else {
              const newCategory: InsertCategory = {
                name: categoryName,
                slug: generateSlug(categoryName),
                description: subcategoryName || section || null,
                icon: null
              };
              
              const category = await storage.createCategory(newCategory);
              categoryId = category.id;
              categories.set(categoryName, categoryId);
              categoryCount++;
              
              if (categoryCount % 10 === 0) {
                console.log(`Создано категорий: ${categoryCount}`);
              }
            }
          } catch (error) {
            errorCount++;
            continue;
          }
        }
        
        if (!categoryId) {
          errorCount++;
          continue;
        }
        
        // Создание товара
        const insertProduct: InsertProduct = {
          sku,
          name: cleanName(name),
          slug: generateSlug(name + '-' + sku),
          description: cleanDescription(description),
          shortDescription: subcategoryName || section || null,
          price: price.toString(),
          originalPrice: null,
          imageUrl: imageUrl || null,
          categoryId: categoryId,
          isActive: inStock === 'Да' || inStock === 'В наличии',
          brand: 'P.I.T.',
          tag: section || null
        };
        
        try {
          await storage.createProduct(insertProduct);
          productCount++;
          
          if (productCount % 500 === 0) {
            console.log(`Импортировано товаров: ${productCount}`);
          }
          
        } catch (error: any) {
          if (error.message.includes('duplicate key')) {
            skippedCount++;
          } else {
            errorCount++;
          }
        }
        
      } catch (error) {
        errorCount++;
      }
    }
    
    console.log(`\n=== ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ ИМПОРТА ===`);
    console.log(`✅ Новых товаров: ${productCount}`);
    console.log(`📂 Новых категорий: ${categoryCount}`);
    console.log(`⏭️ Пропущено: ${skippedCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📊 Всего обработано: ${productCount + skippedCount + errorCount}`);
    
    return { productCount, categoryCount, errorCount, skippedCount };
    
  } catch (error) {
    console.error('Критическая ошибка импорта:', error);
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

function cleanName(name: string): string {
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .trim();
}

function cleanDescription(description: string): string {
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

finalCorrectedImport().catch(console.error);