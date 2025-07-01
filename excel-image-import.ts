import * as XLSX from 'xlsx';
import { DatabaseStorage } from './server/storage';
import { type InsertCategory, type ProductInput } from './shared/schema';
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

// Маппинг категорий к изображениям
const categoryImages = {
  'Дрели': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
  'Шуруповерты': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Гайковерты': 'https://images.unsplash.com/photo-1609205853540-a4eb8a98e85b?w=300&h=200&fit=crop',
  'Перфораторы': 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=300&h=200&fit=crop',
  'Болгарки': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Пилы': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=200&fit=crop',
  'Рубанки': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop',
  'Лобзики': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Фрезеры': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=200&fit=crop',
  'Миксеры': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Инструменты': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop'
};

// Функция для получения изображения для категории
function getCategoryImage(categoryName: string): string {
  const cleanName = cleanText(categoryName);
  
  // Ищем точное совпадение
  if (categoryImages[cleanName]) {
    return categoryImages[cleanName];
  }
  
  // Ищем частичное совпадение
  for (const [key, image] of Object.entries(categoryImages)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return image;
    }
  }
  
  return categoryImages['Инструменты']; // По умолчанию
}

// Функция для генерации URL изображения товара
function generateProductImage(productName: string, sku: string): string {
  // Генерируем URL на основе названия товара
  const seed = encodeURIComponent(productName + sku);
  return `https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format&q=80&seed=${seed}`;
}

// Функция для создания категории если она не существует
async function createCategoryIfNotExists(storage: DatabaseStorage, categoryName: string): Promise<number> {
  const cleanName = cleanText(categoryName);
  if (!cleanName) return 1;

  const slug = generateSlug(cleanName);
  
  const existingCategory = await storage.getCategoryBySlug(slug);
  if (existingCategory) {
    return existingCategory.id;
  }

  const newCategory: InsertCategory = {
    name: cleanName,
    slug: slug,
    description: `Категория ${cleanName}`,
    icon: getCategoryImage(cleanName)
  };

  const created = await storage.createCategory(newCategory);
  console.log(`✅ Создана категория: ${cleanName} с изображением`);
  return created.id;
}

// Извлечение цены из строки
function extractPrice(priceText: any): number {
  if (!priceText) return 0;
  const cleanPrice = String(priceText).replace(/[^\d.,]/g, '').replace(',', '.');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 0 : price;
}

// Функция для определения категории по названию товара
function getCategoryFromProductName(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('дрель') || name.includes('drill')) return 'Дрели';
  if (name.includes('шуруповерт') || name.includes('screwdrive')) return 'Шуруповерты';
  if (name.includes('гайковерт') || name.includes('impact')) return 'Гайковерты';
  if (name.includes('перфоратор') || name.includes('hammer')) return 'Перфораторы';
  if (name.includes('болгарк') || name.includes('grinder')) return 'Болгарки';
  if (name.includes('пила') || name.includes('saw')) return 'Пилы';
  if (name.includes('рубанок') || name.includes('planer')) return 'Рубанки';
  if (name.includes('лобзик') || name.includes('jigsaw')) return 'Лобзики';
  if (name.includes('фрезер') || name.includes('router')) return 'Фрезеры';
  if (name.includes('миксер') || name.includes('mixer')) return 'Миксеры';
  
  return 'Инструменты';
}

// Основная функция импорта
async function importExcelWithImages() {
  try {
    console.log('🚀 Начинаем импорт Excel файла с изображениями...');
    
    const storage = new DatabaseStorage();
    
    // Читаем Excel файл
    const filePath = path.join(process.cwd(), 'attached_assets', 'Prai_774_s_list_DCK_19_06_25_1751384899983.xlsx');
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
        // Структура Excel файла (предполагаемая):
        // A: Артикул
        // B: Название товара
        // C: Цена
        // D: Описание/Характеристики
        // E-G: Дополнительная информация
        
        const sku = cleanText(row[0]);
        const productName = cleanText(row[1]);
        const priceText = row[2];
        const description = cleanText(row[3]);
        
        // Проверяем обязательные поля
        if (!productName || !sku || productName.length < 3) {
          console.log(`⚠️ Строка ${i + 1}: пропущены обязательные поля`);
          continue;
        }
        
        // Определяем категорию по названию товара
        const categoryName = getCategoryFromProductName(productName);
        
        // Создаем или получаем категорию
        const categoryId = await createCategoryIfNotExists(storage, categoryName);
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
          imageUrl: generateProductImage(productName, sku),
          stock: 100,
          categoryId: categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.8, // 20% товаров делаем рекомендуемыми
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
          if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            console.log(`⚠️ Товар с SKU "${sku}" уже существует`);
          } else {
            console.log(`❌ Ошибка создания товара "${sku}": ${error.message}`);
            errorCount++;
          }
        }
        
      } catch (error: any) {
        console.log(`❌ Ошибка в строке ${i + 1}: ${error.message}`);
        errorCount++;
        continue;
      }
    }
    
    console.log('\n🎉 Импорт завершен!');
    console.log(`📂 Категорий создано: ${categoryCount}`);  
    console.log(`📦 Товаров импортировано: ${productCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error(error.stack);
  }
}

// Дополнительная функция для обновления изображений существующих категорий
async function updateCategoryImages() {
  try {
    console.log('🖼️ Обновляем изображения для существующих категорий...');
    
    const storage = new DatabaseStorage();
    const categories = await storage.getAllCategories();
    
    let updatedCount = 0;
    
    for (const category of categories) {
      const imageUrl = getCategoryImage(category.name);
      
      try {
        await storage.updateCategory(category.id, {
          icon: imageUrl
        });
        updatedCount++;
        console.log(`✅ Обновлено изображение для категории: ${category.name}`);
      } catch (error: any) {
        console.log(`❌ Ошибка обновления категории ${category.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Обновлено изображений для ${updatedCount} категорий`);
    
  } catch (error: any) {
    console.error('💥 Ошибка обновления изображений категорий:', error.message);
  }
}

// Запускаем импорт
console.log('='.repeat(50));
console.log('📊 ИМПОРТ EXCEL ФАЙЛА С ИЗОБРАЖЕНИЯМИ');
console.log('='.repeat(50));

Promise.resolve()
  .then(() => updateCategoryImages())
  .then(() => importExcelWithImages())
  .then(() => {
    console.log('✅ Все операции завершены успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });