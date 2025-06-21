import { storage } from './server/storage';
import { readFileSync } from 'fs';
import type { InsertProduct, InsertCategory } from './shared/schema';

async function importPittoolsCSV() {
  console.log('Начинаю импорт каталога pittools.ru из CSV...');
  
  try {
    const csvContent = readFileSync('./pittools-import.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`Найдено ${lines.length} строк для обработки`);
    
    const categories = new Map<string, number>();
    let productCount = 0;
    let categoryCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Разбираем CSV строку (разделитель - точка с запятой)
        const parts = line.split(';');
        if (parts.length < 10) continue;
        
        const [
          imageUrl,
          name,
          sku,
          priceStr,
          currency,
          inStock,
          categoryName,
          subcategoryName,
          ,
          productUrl,
          description
        ] = parts;
        
        if (!name || !sku || !categoryName) continue;
        
        // Создаем или получаем категорию
        let categoryId = categories.get(categoryName);
        if (!categoryId) {
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
        
        // Парсим цену
        const price = parseFloat(priceStr) || 0;
        
        // Создаем товар
        const insertProduct: InsertProduct = {
          sku,
          name: cleanName(name),
          slug: generateSlug(name),
          description: cleanDescription(description || ''),
          shortDescription: subcategoryName || null,
          price: price.toString(),
          originalPrice: null,
          imageUrl: imageUrl || null,
          categoryId,
          supplierId: null,
          isActive: inStock === 'Да',
          stockQuantity: inStock === 'Да' ? 100 : 0,
          weight: null,
          dimensions: null,
          brand: 'P.I.T.',
          tag: null
        };
        
        await storage.createProduct(insertProduct);
        productCount++;
        
        if (productCount % 100 === 0) {
          console.log(`Импортировано ${productCount} товаров, ${categoryCount} категорий...`);
        }
        
      } catch (error) {
        console.log(`Ошибка в строке ${i + 1}: ${error.message}`);
        continue;
      }
    }
    
    console.log(`\n✅ Импорт завершен:`);
    console.log(`📦 Товаров: ${productCount}`);
    console.log(`📂 Категорий: ${categoryCount}`);
    
    return { productCount, categoryCount };
    
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
    .replace(/<[^>]*>/g, '') // Убираем HTML теги
    .replace(/&[^;]+;/g, '') // Убираем HTML entities
    .trim();
}

function cleanDescription(description: string): string {
  if (!description) return '';
  
  return description
    .replace(/<br\s*\/?>/gi, '\n') // Заменяем <br> на переносы строк
    .replace(/<[^>]*>/g, '') // Убираем остальные HTML теги
    .replace(/&[^;]+;/g, '') // Убираем HTML entities
    .replace(/_{2,}/g, '') // Убираем множественные подчеркивания
    .trim()
    .substring(0, 2000); // Ограничиваем длину
}

importPittoolsCSV().catch(console.error);