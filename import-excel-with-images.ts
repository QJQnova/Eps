import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';
import { DatabaseStorage } from './server/storage';
import { type InsertCategory, type InsertProduct, type ProductInput } from './shared/schema';
import { eq } from 'drizzle-orm';
import path from 'path';

// Функция для очистки строки
function cleanText(text: any): string {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ');
}

// Функция для генерации slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Функция для создания категории если она не существует
async function createCategoryIfNotExists(storage: DatabaseStorage, categoryName: string, imageUrl?: string): Promise<number> {
  const cleanName = cleanText(categoryName);
  if (!cleanName) return 1; // Возвращаем ID по умолчанию

  const slug = generateSlug(cleanName);
  
  // Проверяем, существует ли категория
  const existingCategory = await storage.getCategoryBySlug(slug);
  
  if (existingCategory) {
    return existingCategory.id;
  }

  // Создаем новую категорию
  const newCategory: InsertCategory = {
    name: cleanName,
    slug: slug,
    description: `Категория ${cleanName}`,
    icon: imageUrl || "tool"
  };

  const created = await storage.createCategory(newCategory);
  console.log(`✅ Создана категория: ${cleanName}`);
  return created.id;
}

// Извлечение цены из строки
function extractPrice(priceText: any): number {
  if (!priceText) return 0;
  const cleanPrice = String(priceText).replace(/[^\d.,]/g, '').replace(',', '.');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 0 : price;
}

// Основная функция импорта
async function importExcelWithImages() {
  try {
    console.log('🚀 Начинаем импорт Excel файла с изображениями...');
    
    const storage = new DatabaseStorage();
    
    // Читаем Excel файл
    const filePath = path.join(__dirname, 'attached_assets', 'Prai_774_s_list_DCK_19_06_25_1751384899983.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертируем в JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📋 Найдено ${data.length} строк в Excel файле`);
    
    let categoryCount = 0;
    let productCount = 0;
    let errorCount = 0;
    const processedCategories = new Set<string>();
    
    // Проходим по каждой строке (пропускаем заголовки)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      
      try {
        // Предполагаемая структура Excel файла:
        // Колонка A: Изображение товара
        // Колонка B: Название товара
        // Колонка C: SKU/Артикул
        // Колонка D: Цена
        // Колонка E: Категория
        // Колонка F: Описание
        // Колонка G: Изображение категории (если есть)
        
        const imageUrl = cleanText(row[0]);
        const productName = cleanText(row[1]);
        const sku = cleanText(row[2]);
        const priceText = row[3];
        const categoryName = cleanText(row[4]);
        const description = cleanText(row[5]);
        const categoryImageUrl = cleanText(row[6]);
        
        // Проверяем обязательные поля
        if (!productName || !sku || !categoryName) {
          console.log(`⚠️ Строка ${i + 1}: пропущены обязательные поля`);
          continue;
        }
        
        // Создаем или получаем категорию
        const categoryId = await createCategoryIfNotExists(storage, categoryName, categoryImageUrl);
        if (!processedCategories.has(categoryName)) {
          categoryCount++;
          processedCategories.add(categoryName);
        }
        
        // Создаем товар
        const productData: ProductInput = {
          sku: sku,
          name: productName,
          slug: generateSlug(productName + '-' + sku),
          description: description || `Товар ${productName}`,
          shortDescription: categoryName,
          price: extractPrice(priceText),
          originalPrice: null,
          imageUrl: imageUrl || null,
          stock: 100, // По умолчанию в наличии
          categoryId: categoryId,
          isActive: true,
          isFeatured: false,
          tag: null
        };
        
        // Пытаемся создать товар
        try {
          await storage.createProduct(productData);
          productCount++;
          
          if (productCount % 50 === 0) {
            console.log(`📦 Обработано ${productCount} товаров, ${categoryCount} категорий...`);
          }
        } catch (error: any) {
          if (error.message.includes('duplicate key')) {
            console.log(`⚠️ Товар с SKU "${sku}" уже существует`);
          } else {
            console.log(`❌ Ошибка создания товара "${sku}": ${error.message}`);
            errorCount++;
          }
        }
        
      } catch (error: any) {
        console.log(`❌ Ошибка в строке ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Импорт завершен!');
    console.log(`📂 Категорий создано: ${categoryCount}`);  
    console.log(`📦 Товаров импортировано: ${productCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message);
  }
}

// Запускаем импорт
importExcelWithImages().then(() => {
  console.log('✅ Импорт завершен успешно');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Ошибка импорта:', error);
  process.exit(1);
});