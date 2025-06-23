
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import { storage } from "./server/storage";
import { InsertProduct } from "./shared/schema";

// Функция для определения кодировки и чтения файла
function readFileWithProperEncoding(filePath: string): string {
  // Сначала попробуем прочитать как UTF-8
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log('UTF-8 не сработала, пробуем windows-1251...');
    try {
      // Используем iconv-lite для чтения windows-1251
      const iconv = require('iconv-lite');
      const buffer = fs.readFileSync(filePath);
      return iconv.decode(buffer, 'windows-1251');
    } catch (error2) {
      console.log('windows-1251 не сработала, пробуем latin1...');
      return fs.readFileSync(filePath, 'latin1');
    }
  }
}

// Функция очистки текста
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[^\u0000-\u007F\u0400-\u04FF\u0020-\u007E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Функция генерации slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Создание категорий
async function createCategoryIfNotExists(categoryName: string): Promise<number> {
  const cleanedName = cleanText(categoryName);
  if (!cleanedName) return 46; // Возвращаем ID категории "Инструменты" по умолчанию
  
  const slug = generateSlug(cleanedName);
  
  try {
    const existingCategory = await storage.getCategoryBySlug(slug);
    if (existingCategory) {
      return existingCategory.id;
    }
    
    const newCategory = await storage.createCategory({
      name: cleanedName,
      slug: slug,
      description: `Категория ${cleanedName}`,
      icon: 'tool'
    });
    
    console.log(`✅ Создана категория: ${cleanedName} (ID: ${newCategory.id})`);
    return newCategory.id;
  } catch (error) {
    console.error(`❌ Ошибка создания категории ${cleanedName}:`, error);
    return 46; // Fallback к категории "Инструменты"
  }
}

async function importPittoolsFromCSV() {
  console.log('🚀 Начинаю автоматический импорт товаров из CSV файла...');
  
  const filePath = './attached_assets/3385076--pittools.ru (1)_1750678441052.csv';
  
  try {
    // Читаем файл с правильной кодировкой
    console.log('📖 Читаю CSV файл с автоопределением кодировки...');
    const content = readFileWithProperEncoding(filePath);
    
    if (!content || content.length < 100) {
      throw new Error('Файл пустой или слишком маленький');
    }
    
    console.log(`✅ Файл прочитан успешно: ${content.length} символов`);
    
    // Парсим CSV
    console.log('🔄 Парсинг CSV данных...');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: true
    });
    
    console.log(`📊 Найдено ${records.length} записей в CSV`);
    
    // Статистика
    let productCount = 0;
    let categoryCount = 0;
    let errorCount = 0;
    const createdCategories = new Set<string>();
    
    // Пакетная обработка товаров
    const batchSize = 100;
    const totalBatches = Math.ceil(records.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, records.length);
      const batch = records.slice(startIdx, endIdx);
      
      console.log(`\n📦 Обрабатываю пакет ${batchIndex + 1}/${totalBatches} (строки ${startIdx + 1}-${endIdx})`);
      
      const productsToImport: InsertProduct[] = [];
      
      for (let i = 0; i < batch.length; i++) {
        const record = batch[i];
        const globalIndex = startIdx + i;
        
        try {
          // Извлекаем данные с различными вариантами названий колонок
          const name = cleanText(
            record['Название'] || record['наименование'] || record['name'] || 
            record['товар'] || record['продукт'] || record['Наименование'] || ''
          );
          
          const sku = cleanText(
            record['Артикул'] || record['sku'] || record['код'] || 
            record['id'] || record['номер'] || `PITTOOLS-${globalIndex + 1}`
          );
          
          const priceStr = record['Цена'] || record['цена'] || record['price'] || record['стоимость'] || '0';
          const cleanPriceStr = String(priceStr).replace(/[^\d.,]/g, '').replace(',', '.');
          const price = parseFloat(cleanPriceStr) || 0;
          
          const categoryName = cleanText(
            record['Категория'] || record['категория'] || record['category'] || 
            record['группа'] || record['раздел'] || 'Инструменты'
          );
          
          const description = cleanText(
            record['Описание'] || record['описание'] || record['description'] || 
            record['характеристики'] || `Профессиональный инструмент ${name}`
          );
          
          const availability = record['Наличие'] || record['наличие'] || record['остаток'] || 'Да';
          const isActive = !['нет', 'no', '0', 'отсутствует', 'нет в наличии'].includes(
            String(availability).toLowerCase().trim()
          );
          
          // Пропускаем записи без названия
          if (!name || name.length < 2) {
            continue;
          }
          
          // Создаем категорию если нужно
          let categoryId = 46; // По умолчанию "Инструменты"
          if (categoryName && !createdCategories.has(categoryName)) {
            categoryId = await createCategoryIfNotExists(categoryName);
            createdCategories.add(categoryName);
            categoryCount++;
          } else if (categoryName && createdCategories.has(categoryName)) {
            const slug = generateSlug(categoryName);
            const existingCategory = await storage.getCategoryBySlug(slug);
            if (existingCategory) {
              categoryId = existingCategory.id;
            }
          }
          
          // Создаем товар
          const product: InsertProduct = {
            sku: sku,
            name: name,
            slug: generateSlug(`${name}-${sku}`),
            description: description,
            shortDescription: name.length > 100 ? name.substring(0, 97) + '...' : name,
            price: price.toString(),
            originalPrice: null,
            imageUrl: null,
            categoryId: categoryId,
            stock: isActive ? Math.floor(Math.random() * 20) + 5 : 0,
            isActive: isActive,
            isFeatured: Math.random() > 0.95,
            tag: 'P.I.T. Tools'
          };
          
          productsToImport.push(product);
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Ошибка обработки строки ${globalIndex + 1}:`, error);
          continue;
        }
      }
      
      // Массовый импорт пакета
      if (productsToImport.length > 0) {
        try {
          console.log(`💾 Импортирую ${productsToImport.length} товаров...`);
          const result = await storage.bulkImportProducts(productsToImport);
          productCount += result.success;
          errorCount += result.failed;
          
          console.log(`✅ Пакет ${batchIndex + 1}: импортировано ${result.success}, ошибок ${result.failed}`);
        } catch (error) {
          console.error(`❌ Ошибка импорта пакета ${batchIndex + 1}:`, error);
          errorCount += productsToImport.length;
        }
      }
      
      // Небольшая пауза между пакетами
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Итоговая статистика
    console.log('\n🎉 ИМПОРТ ЗАВЕРШЕН!');
    console.log('📈 СТАТИСТИКА:');
    console.log(`   📦 Всего товаров импортировано: ${productCount}`);
    console.log(`   📂 Новых категорий создано: ${categoryCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    console.log(`   📊 Обработано записей: ${records.length}`);
    console.log(`   ✅ Успешность: ${((productCount / records.length) * 100).toFixed(1)}%`);
    
  } catch (error: any) {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error('Стек ошибки:', error.stack);
  }
}

// Установка необходимых пакетов и запуск
async function installAndRun() {
  try {
    console.log('📦 Устанавливаю необходимые пакеты...');
    const { execSync } = require('child_process');
    
    try {
      execSync('npm install iconv-lite', { stdio: 'inherit' });
      console.log('✅ Пакет iconv-lite установлен');
    } catch (installError) {
      console.log('⚠️ Не удалось установить iconv-lite, продолжаю без него');
    }
    
    await importPittoolsFromCSV();
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

// Запуск скрипта
if (require.main === module) {
  installAndRun();
}

export { importPittoolsFromCSV };
