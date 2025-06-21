import { storage } from './server/storage';
import { readFileSync } from 'fs';
import type { InsertProduct, InsertCategory } from './shared/schema';

async function importPittoolsCSV() {
  console.log('Начинаю импорт каталога pittools.ru...');
  
  try {
    const csvContent = readFileSync('./pittools-import.csv', 'utf-8');
    
    // Ищем все строки с товарами
    const productLines = csvContent.split('\n').filter(line => 
      line.startsWith('https://pittools.ru/upload/') && 
      (line.includes('.png;') || line.includes('.jpg;') || line.includes('.jpeg;'))
    );
    
    console.log(`Найдено ${productLines.length} записей товаров`);
    
    const categories = new Map<string, number>();
    const processedSKUs = new Set<string>();
    let productCount = 0;
    let categoryCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < productLines.length; i++) {
      const line = productLines[i].trim();
      if (!line) continue;
      
      try {
        const parts = line.split(';');
        if (parts.length < 10) {
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
        const subcategoryName = parts[7]?.trim();
        const section = parts[8]?.trim();
        const productUrl = parts[9]?.trim();
        const description = parts[10]?.trim().replace(/"/g, '');
        
        // Пропускаем если уже обработан
        if (!name || !sku || !categoryName || !priceStr || processedSKUs.has(sku)) {
          skippedCount++;
          continue;
        }
        
        processedSKUs.add(sku);
        
        // Парсим цену
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
          errorCount++;
          continue;
        }
        
        // Создаем или получаем категорию
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
                description: subcategoryName || null,
                icon: null
              };
              
              const category = await storage.createCategory(newCategory);
              categoryId = category.id;
              categories.set(categoryName, categoryId);
              categoryCount++;
              
              console.log(`Создана категория: ${categoryName}`);
            }
          } catch (error) {
            errorCount++;
            continue;
          }
        }
        
        // Создаем товар
        const insertProduct: InsertProduct = {
          sku,
          name: cleanName(name),
          slug: generateSlug(name + '-' + sku),
          description: cleanDescription(description || ''),
          shortDescription: subcategoryName || null,
          price: price.toString(),
          originalPrice: null,
          imageUrl: imageUrl || null,
          categoryId: categoryId,
          isActive: inStock === 'Да',
          weight: null,
          dimensions: null,
          brand: 'P.I.T.',
          tag: null
        };
        
        try {
          await storage.createProduct(insertProduct);
          productCount++;
          
          if (productCount % 50 === 0) {
            console.log(`Импортировано ${productCount} товаров, ${categoryCount} категорий...`);
          }
          
        } catch (error) {
          errorCount++;
          if (!error.message.includes('duplicate key')) {
            console.log(`Ошибка создания товара "${sku}": ${error.message}`);
          }
        }
        
      } catch (error) {
        errorCount++;
        continue;
      }
    }
    
    console.log(`\n✅ Импорт завершен:`);
    console.log(`📦 Новых товаров: ${productCount}`);
    console.log(`📂 Новых категорий: ${categoryCount}`);
    console.log(`⏭️ Пропущено: ${skippedCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
    return { productCount, categoryCount, errorCount, skippedCount };
    
  } catch (error) {
    console.error('Ошибка при импорте:', error);
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
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .replace(/_{2,}/g, '')
    .trim()
    .substring(0, 2000);
}

importPittoolsCSV().catch(console.error);