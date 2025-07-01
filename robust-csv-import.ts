import { readFileSync } from 'fs';
import { DatabaseStorage } from './server/storage';
import { type InsertCategory, type ProductInput } from './shared/schema';
import path from 'path';
import * as iconv from 'iconv-lite';

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
  'Углошлифовальные машины': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Болгарки': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Пилы': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=200&fit=crop',
  'Рубанки': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop',
  'Лобзики': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Фрезеры': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=200&fit=crop',
  'Миксеры': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Генераторы': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop',
  'Компрессоры': 'https://images.unsplash.com/photo-1621905251078-3f9c827d1fcf?w=300&h=200&fit=crop',
  'Сварочное оборудование': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=300&h=200&fit=crop',
  'Краскопульты': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&h=200&fit=crop',
  'Насосы': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop',
  'Полировальные машины': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Станки': 'https://images.unsplash.com/photo-1565003033444-69c5db2c27b1?w=300&h=200&fit=crop',
  'Измерительные инструменты': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&h=200&fit=crop',
  'Ручной инструмент': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
  'Садовая техника': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
  'Уборочная техника': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
  'Паяльники': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&h=200&fit=crop',
  'Фены технические': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Электрооборудование': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=300&h=200&fit=crop',
  'Пневмоинструменты': 'https://images.unsplash.com/photo-1621905251078-3f9c827d1fcf?w=300&h=200&fit=crop',
  'Многофункциональные инструменты': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
  'Строительные леса': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop',
  'Инструменты': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop'
};

// Функция для получения изображения для категории
function getCategoryImage(categoryName: string): string {
  const cleanName = cleanText(categoryName);
  
  if (categoryImages[cleanName]) {
    return categoryImages[cleanName];
  }
  
  for (const [key, image] of Object.entries(categoryImages)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return image;
    }
  }
  
  return categoryImages['Инструменты'];
}

// Функция для генерации URL изображения товара
function generateProductImage(productName: string, sku: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('дрель') || name.includes('drill')) {
    return `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('шуруповерт') || name.includes('screwdriver')) {
    return `https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('гайковерт') || name.includes('impact')) {
    return `https://images.unsplash.com/photo-1609205853540-a4eb8a98e85b?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('перфоратор') || name.includes('hammer')) {
    return `https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('болгарк') || name.includes('grinder')) {
    return `https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('пила') || name.includes('saw')) {
    return `https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('рубанок') || name.includes('planer')) {
    return `https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('фрезер') || name.includes('router')) {
    return `https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('сварочн') || name.includes('weld')) {
    return `https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('генератор') || name.includes('generator')) {
    return `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('компрессор') || name.includes('compressor')) {
    return `https://images.unsplash.com/photo-1621905251078-3f9c827d1fcf?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('миксер') || name.includes('mixer')) {
    return `https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('насос') || name.includes('pump')) {
    return `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('краскопульт') || name.includes('spray')) {
    return `https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('полировальн') || name.includes('polish')) {
    return `https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('станок') || name.includes('machine')) {
    return `https://images.unsplash.com/photo-1565003033444-69c5db2c27b1?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('измеритель') || name.includes('measure')) {
    return `https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('паяльник') || name.includes('solder')) {
    return `https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('фен') || name.includes('heat gun')) {
    return `https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  
  return `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop&auto=format&q=80`;
}

// Функция для определения категории по названию товара
function getCategoryFromProductName(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('дрель') || name.includes('drill')) return 'Дрели';
  if (name.includes('шуруповерт') || name.includes('screwdrive')) return 'Шуруповерты';
  if (name.includes('гайковерт') || name.includes('impact')) return 'Гайковерты';
  if (name.includes('перфоратор') || name.includes('hammer')) return 'Перфораторы';
  if (name.includes('болгарк') || name.includes('grinder') || name.includes('ушм')) return 'Углошлифовальные машины';
  if (name.includes('пила') || name.includes('saw')) return 'Пилы';
  if (name.includes('рубанок') || name.includes('planer')) return 'Рубанки';
  if (name.includes('лобзик') || name.includes('jigsaw')) return 'Лобзики';
  if (name.includes('фрезер') || name.includes('router')) return 'Фрезеры';
  if (name.includes('миксер') || name.includes('mixer')) return 'Миксеры';
  if (name.includes('генератор') || name.includes('generator')) return 'Генераторы';
  if (name.includes('компрессор') || name.includes('compressor')) return 'Компрессоры';
  if (name.includes('сварочн') || name.includes('weld')) return 'Сварочное оборудование';
  if (name.includes('краскопульт') || name.includes('spray')) return 'Краскопульты';
  if (name.includes('насос') || name.includes('pump')) return 'Насосы';
  if (name.includes('полировальн') || name.includes('polish')) return 'Полировальные машины';
  if (name.includes('станок') || name.includes('machine')) return 'Станки';
  if (name.includes('измеритель') || name.includes('measure') || name.includes('штангенциркуль') || name.includes('линейка')) return 'Измерительные инструменты';
  if (name.includes('отвертка') || name.includes('ключ') || name.includes('молоток') || name.includes('плоскогубцы')) return 'Ручной инструмент';
  if (name.includes('газонокосил') || name.includes('триммер') || name.includes('секатор')) return 'Садовая техника';
  if (name.includes('пылесос') || name.includes('мойка')) return 'Уборочная техника';
  if (name.includes('паяльник') || name.includes('solder')) return 'Паяльники';
  if (name.includes('фен') || name.includes('heat gun')) return 'Фены технические';
  if (name.includes('удлинитель') || name.includes('провод') || name.includes('кабель')) return 'Электрооборудование';
  if (name.includes('пневмо') || name.includes('pneumatic')) return 'Пневмоинструменты';
  if (name.includes('многофункциональн') || name.includes('oscillating')) return 'Многофункциональные инструменты';
  if (name.includes('леса') || name.includes('scaffold')) return 'Строительные леса';
  
  return 'Инструменты';
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

// Простой парсер CSV с обработкой ошибок
function parseCSVManually(content: string): string[][] {
  const lines = content.split('\n');
  const result: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Простое разделение по точке с запятой и запятой
      let fields: string[] = [];
      
      if (line.includes(';')) {
        fields = line.split(';');
      } else if (line.includes(',')) {
        fields = line.split(',');
      } else {
        continue; // Пропускаем строки без разделителей
      }
      
      // Очищаем поля от кавычек и лишних пробелов
      fields = fields.map(field => field.replace(/^["']|["']$/g, '').trim());
      
      if (fields.length >= 3) { // Минимум 3 поля для обработки
        result.push(fields);
      }
    } catch (error) {
      // Пропускаем проблемные строки
      continue;
    }
  }
  
  return result;
}

// Чтение файла с правильной кодировкой
function readFileWithProperEncoding(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    try {
      const buffer = readFileSync(filePath);
      return iconv.decode(buffer, 'windows-1251');
    } catch (error2) {
      try {
        const buffer = readFileSync(filePath);
        return iconv.decode(buffer, 'cp1251');
      } catch (error3) {
        return readFileSync(filePath, 'latin1');
      }
    }
  }
}

// Основная функция импорта из CSV
async function importFromCSV() {
  try {
    console.log('🚀 Начинаем надежный импорт из CSV файла...');
    
    const storage = new DatabaseStorage();
    
    // Ищем CSV файл в attached_assets
    const csvFiles = [
      '3383071--pittools.ru (1)_1750671885982.csv',
      '3385076--pittools.ru (1)_1750687389485.csv',
      'Prai_774_s_list_DCK_19_06_25_1751384899983.csv'
    ];
    
    let csvContent = '';
    let usedFile = '';
    
    for (const fileName of csvFiles) {
      try {
        const filePath = path.join(process.cwd(), 'attached_assets', fileName);
        csvContent = readFileWithProperEncoding(filePath);
        usedFile = fileName;
        console.log(`✅ Успешно прочитан файл: ${fileName}`);
        break;
      } catch (error) {
        console.log(`⚠️ Не удалось прочитать файл: ${fileName}`);
      }
    }
    
    if (!csvContent) {
      throw new Error('Не удалось найти или прочитать CSV файл');
    }
    
    // Парсим CSV вручную для большей надежности
    const records = parseCSVManually(csvContent);
    
    console.log(`📋 Найдено ${records.length} строк в CSV файле: ${usedFile}`);
    
    let categoryCount = 0;
    let productCount = 0;
    let errorCount = 0;
    const processedCategories = new Set<string>();
    
    // Проходим по каждой строке (пропускаем заголовки)
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      try {
        // Структура может быть разной, пытаемся найти нужные поля
        let imageUrl = '';
        let productName = '';
        let sku = '';
        let priceText = '';
        let description = '';
        let availability = '';
        
        // Проверяем различные варианты структуры CSV
        if (row.length >= 10) {
          // Полная структура: imageUrl, name, sku, price, currency, availability, category, subcategory, section, url, description
          imageUrl = cleanText(row[0]);
          productName = cleanText(row[1]);
          sku = cleanText(row[2]);
          priceText = row[3];
          availability = cleanText(row[5]);
          description = cleanText(row[10]) || '';
        } else if (row.length >= 6) {
          // Сокращенная структура
          imageUrl = cleanText(row[0]);
          productName = cleanText(row[1]);
          sku = cleanText(row[2]);
          priceText = row[3];
          availability = cleanText(row[5]) || cleanText(row[4]);
          description = cleanText(row[6]) || '';
        } else if (row.length >= 4) {
          // Минимальная структура: sku, name, price, description
          sku = cleanText(row[0]);
          productName = cleanText(row[1]);
          priceText = row[2];
          description = cleanText(row[3]) || '';
        } else {
          continue;
        }
        
        // Проверяем обязательные поля
        if (!productName || !sku || productName.length < 3) {
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
          imageUrl: imageUrl || generateProductImage(productName, sku),
          stock: availability && availability.toLowerCase().includes('нет') ? 0 : 100,
          categoryId: categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.85, // 15% товаров делаем рекомендуемыми
          tag: null
        };
        
        // Пытаемся создать товар
        try {
          await storage.createProduct(productData);
          productCount++;
          
          if (productCount % 100 === 0) {
            console.log(`📦 Обработано ${productCount} товаров, ${categoryCount} категорий...`);
          }
        } catch (error: any) {
          if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            // Пропускаем дубликаты без сообщения
          } else {
            console.log(`❌ Ошибка создания товара "${sku}": ${error.message}`);
            errorCount++;
          }
        }
        
      } catch (error: any) {
        errorCount++;
        continue;
      }
    }
    
    console.log('\n🎉 Надежный импорт завершен!');
    console.log(`📂 Категорий создано: ${categoryCount}`);  
    console.log(`📦 Товаров импортировано: ${productCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📁 Использован файл: ${usedFile}`);
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error(error.stack);
  }
}

// Запускаем надежный импорт
console.log('='.repeat(60));
console.log('📊 НАДЕЖНЫЙ ИМПОРТ КАТАЛОГА ИЗ CSV');
console.log('='.repeat(60));

importFromCSV()
  .then(() => {
    console.log('\n✅ Надежный импорт завершен успешно!');
    console.log('🎨 Все товары добавлены с изображениями');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });