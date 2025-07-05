
import { readFileSync, readdirSync, existsSync } from 'fs';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { DatabaseStorage } from './server/storage';
import { type ProductInput } from './shared/schema';
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

// Функция для поиска изображения по артикулу
function findImageForSKU(sku: string): string | null {
  const imageDir = './client/public/images/products/';
  
  if (!existsSync(imageDir)) {
    console.log('Папка с изображениями не найдена:', imageDir);
    return null;
  }

  const imageFiles = readdirSync(imageDir);
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  
  // Ищем файл с точным совпадением артикула
  for (const ext of extensions) {
    const exactMatch = `${sku}${ext}`;
    if (imageFiles.includes(exactMatch)) {
      return `/images/products/${exactMatch}`;
    }
  }
  
  // Ищем файл, содержащий артикул в названии
  const skuLower = sku.toLowerCase();
  for (const file of imageFiles) {
    const fileName = file.toLowerCase();
    if (fileName.includes(skuLower)) {
      return `/images/products/${file}`;
    }
  }
  
  return null;
}

// Функция для создания категории если она не существует
async function createCategoryIfNotExists(storage: DatabaseStorage, categoryName: string): Promise<number> {
  const cleanName = cleanText(categoryName);
  if (!cleanName) return 1; // Возвращаем ID по умолчанию

  const slug = generateSlug(cleanName);
  
  // Проверяем, существует ли категория
  const existingCategory = await storage.getCategoryBySlug(slug);
  
  if (existingCategory) {
    return existingCategory.id;
  }

  // Создаем новую категорию
  const newCategory = await storage.createCategory({
    name: cleanName,
    slug: slug,
    description: `Категория ${cleanName}`,
    icon: "tool"
  });

  console.log(`✅ Создана категория: ${cleanName}`);
  return newCategory.id;
}

// Извлечение цены из строки
function extractPrice(priceText: any): string {
  if (!priceText) return '0';
  const cleanPrice = String(priceText).replace(/[^\d.,]/g, '').replace(',', '.');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? '0' : price.toString();
}

// Основная функция импорта
async function importWithImages() {
  try {
    console.log('🚀 Начинаем импорт товаров с автопривязкой изображений...');
    
    const storage = new DatabaseStorage();
    
    // Определяем файл для импорта
    let filePath = '';
    let data: any[] = [];
    
    // Ищем CSV файлы в attached_assets
    const csvFiles = readdirSync('./attached_assets').filter(f => f.endsWith('.csv'));
    const xlsxFiles = readdirSync('./attached_assets').filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
    
    if (csvFiles.length > 0) {
      filePath = `./attached_assets/${csvFiles[0]}`;
      console.log(`📋 Найден CSV файл: ${csvFiles[0]}`);
      
      const content = readFileSync(filePath, 'utf-8');
      data = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ';',
        quote: '"'
      });
    } else if (xlsxFiles.length > 0) {
      filePath = `./attached_assets/${xlsxFiles[0]}`;
      console.log(`📋 Найден Excel файл: ${xlsxFiles[0]}`);
      
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error('Не найдено CSV или Excel файлов в папке attached_assets');
    }
    
    console.log(`📊 Найдено ${data.length} записей для импорта`);
    
    let categoryCount = 0;
    let productCount = 0;
    let errorCount = 0;
    let imageCount = 0;
    const processedCategories = new Set<string>();
    
    // Проходим по каждой записи
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Извлекаем данные из разных возможных колонок
        const sku = cleanText(
          row['sku'] || row['SKU'] || row['артикул'] || row['Артикул'] || 
          row['код'] || row['Код'] || `AUTO-${Date.now()}-${i}`
        );
        
        const productName = cleanText(
          row['name'] || row['Name'] || row['название'] || row['Название'] || 
          row['наименование'] || row['Наименование'] || row['товар'] || row['Товар']
        );
        
        const price = extractPrice(
          row['price'] || row['Price'] || row['цена'] || row['Цена'] || 
          row['стоимость'] || row['Стоимость']
        );
        
        const categoryName = cleanText(
          row['category'] || row['Category'] || row['категория'] || row['Категория'] ||
          row['группа'] || row['Группа'] || 'Общие товары'
        );
        
        const description = cleanText(
          row['description'] || row['Description'] || row['описание'] || row['Описание'] || ''
        );
        
        // Проверяем обязательные поля
        if (!productName || productName.length < 2) {
          console.log(`⚠️ Строка ${i + 1}: отсутствует название товара`);
          continue;
        }
        
        // Создаем или получаем категорию
        const categoryId = await createCategoryIfNotExists(storage, categoryName);
        if (!processedCategories.has(categoryName)) {
          categoryCount++;
          processedCategories.add(categoryName);
        }
        
        // Ищем изображение для товара
        const imageUrl = findImageForSKU(sku);
        if (imageUrl) {
          imageCount++;
          console.log(`🖼️ Найдено изображение для ${sku}: ${imageUrl}`);
        }
        
        // Создаем товар
        const productData: ProductInput = {
          sku: sku,
          name: productName,
          slug: generateSlug(productName + '-' + sku),
          description: description || `Товар ${productName}`,
          shortDescription: description ? description.substring(0, 200) : productName,
          price: price,
          originalPrice: null,
          imageUrl: imageUrl,
          stock: 100, // По умолчанию в наличии
          categoryId: categoryId,
          isActive: true,
          isFeatured: false,
          tag: 'imported-with-images'
        };
        
        // Пытаемся создать товар
        try {
          await storage.createProduct(productData);
          productCount++;
          
          if (productCount % 20 === 0) {
            console.log(`📦 Обработано ${productCount} товаров, ${imageCount} с изображениями...`);
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
    console.log(`🖼️ Товаров с изображениями: ${imageCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message);
  }
}

// Запускаем импорт
importWithImages().then(() => {
  console.log('✅ Импорт завершен успешно');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Ошибка импорта:', error);
  process.exit(1);
});
