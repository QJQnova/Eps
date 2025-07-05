
import { readFileSync, readdirSync, existsSync, copyFileSync } from 'fs';
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

// Функция для поиска и копирования изображения по артикулу
function findAndCopyImageForSKU(sku: string, sourceImageDir: string): string | null {
  const targetImageDir = './client/public/images/products/';
  
  if (!existsSync(sourceImageDir)) {
    console.log('❌ Папка с исходными изображениями не найдена:', sourceImageDir);
    return null;
  }

  if (!existsSync(targetImageDir)) {
    console.log('📁 Создаем папку для изображений товаров...');
    require('fs').mkdirSync(targetImageDir, { recursive: true });
  }

  const imageFiles = readdirSync(sourceImageDir);
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.JPG', '.JPEG', '.PNG'];
  
  // Ищем файл с точным совпадением артикула
  for (const ext of extensions) {
    const exactMatch = `${sku}${ext}`;
    if (imageFiles.includes(exactMatch)) {
      const sourcePath = path.join(sourceImageDir, exactMatch);
      const targetPath = path.join(targetImageDir, exactMatch);
      
      try {
        copyFileSync(sourcePath, targetPath);
        console.log(`📋 Скопировано изображение: ${exactMatch}`);
        return `/images/products/${exactMatch}`;
      } catch (error) {
        console.log(`❌ Ошибка копирования ${exactMatch}:`, error);
      }
    }
  }
  
  // Ищем файл, содержащий артикул в названии
  const skuLower = sku.toLowerCase();
  for (const file of imageFiles) {
    const fileName = file.toLowerCase();
    if (fileName.includes(skuLower) && extensions.some(ext => fileName.endsWith(ext.toLowerCase()))) {
      const sourcePath = path.join(sourceImageDir, file);
      const newFileName = `${sku}${path.extname(file)}`;
      const targetPath = path.join(targetImageDir, newFileName);
      
      try {
        copyFileSync(sourcePath, targetPath);
        console.log(`📋 Скопировано и переименовано: ${file} -> ${newFileName}`);
        return `/images/products/${newFileName}`;
      } catch (error) {
        console.log(`❌ Ошибка копирования ${file}:`, error);
      }
    }
  }
  
  return null;
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
async function importWithLocalImages() {
  try {
    console.log('🚀 Начинаем импорт товаров с локальными изображениями...');
    
    const storage = new DatabaseStorage();
    
    // Путь к папке с изображениями на вашем компьютере
    // ВАЖНО: Измените этот путь на папку с вашими изображениями!
    const sourceImageDir = './attached_assets/images'; // Замените на свой путь
    
    console.log(`📁 Ищем изображения в папке: ${sourceImageDir}`);
    
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
          row['код'] || row['Код'] || row['Код товара'] || `AUTO-${Date.now()}-${i}`
        );
        
        const productName = cleanText(
          row['name'] || row['Name'] || row['название'] || row['Название'] || 
          row['наименование'] || row['Наименование'] || row['товар'] || row['Товар'] ||
          row['Наименование товара']
        );
        
        const price = extractPrice(
          row['price'] || row['Price'] || row['цена'] || row['Цена'] || 
          row['стоимость'] || row['Стоимость'] || row['Цена, руб']
        );
        
        const categoryName = cleanText(
          row['category'] || row['Category'] || row['категория'] || row['Категория'] ||
          row['группа'] || row['Группа'] || row['Группа товаров'] || 'Общие товары'
        );
        
        const description = cleanText(
          row['description'] || row['Description'] || row['описание'] || row['Описание'] || 
          row['Описание товара'] || ''
        );
        
        // Проверяем обязательные поля
        if (!productName || productName.length < 2) {
          console.log(`⚠️ Строка ${i + 1}: отсутствует название товара`);
          continue;
        }
        
        if (!sku || sku.length < 2) {
          console.log(`⚠️ Строка ${i + 1}: отсутствует артикул товара`);
          continue;
        }
        
        // Создаем или получаем категорию
        const categoryId = await createCategoryIfNotExists(storage, categoryName);
        if (!processedCategories.has(categoryName)) {
          categoryCount++;
          processedCategories.add(categoryName);
        }
        
        // Ищем и копируем изображение для товара
        const imageUrl = findAndCopyImageForSKU(sku, sourceImageDir);
        if (imageUrl) {
          imageCount++;
          console.log(`🖼️ Привязано изображение для ${sku}: ${imageUrl}`);
        } else {
          console.log(`📷 Изображение для ${sku} не найдено`);
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
          stock: 100,
          categoryId: categoryId,
          isActive: true,
          isFeatured: false,
          tag: 'imported-with-local-images'
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
importWithLocalImages().then(() => {
  console.log('✅ Импорт завершен успешно');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Ошибка импорта:', error);
  process.exit(1);
});
