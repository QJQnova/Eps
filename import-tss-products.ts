import fs from 'fs';
import path from 'path';
import { DatabaseStorage } from './server/storage';
import { InsertProduct, InsertCategory } from './shared/schema';
import { parse } from 'csv-parse/sync';

interface TSSProduct {
  id: string;
  description: string;
  name: string;
  price: string;
  currencyId: string;
  categoryId: string;
  picture: string;
  url: string;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function cleanText(text: any): string {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
}

function extractPrice(priceText: string): number {
  if (!priceText || priceText === '0') return 0;
  const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
  return isNaN(numericPrice) ? 0 : numericPrice;
}

function getCategoryFromName(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('генератор') || name.includes('generator')) return 'Генераторы';
  if (name.includes('двигатель') || name.includes('engine')) return 'Двигатели';
  if (name.includes('регулятор') || name.includes('avr')) return 'Регуляторы напряжения';
  if (name.includes('виброрейка') || name.includes('виброплита')) return 'Виброоборудование';
  if (name.includes('вибротрамбовка')) return 'Виброоборудование';
  if (name.includes('салазки') || name.includes('прицеп')) return 'Шасси и прицепы';
  if (name.includes('подогреватель') || name.includes('пжд')) return 'Системы подогрева';
  if (name.includes('сварочный') || name.includes('сварка')) return 'Сварочное оборудование';
  if (name.includes('компрессор')) return 'Компрессоры';
  if (name.includes('насос')) return 'Насосы';
  if (name.includes('станок')) return 'Станки';
  
  return 'Промышленное оборудование';
}

async function createCategoryIfNotExists(storage: DatabaseStorage, categoryName: string): Promise<number> {
  const categories = await storage.getAllCategories();
  const existingCategory = categories.find(cat => cat.name === categoryName);
  
  if (existingCategory) {
    return existingCategory.id;
  }
  
  const newCategory: InsertCategory = {
    name: categoryName,
    slug: generateSlug(categoryName),
    description: `Категория ${categoryName} от поставщика TSS.RU`,
    imageUrl: `/images/categories/${generateSlug(categoryName)}.jpg`,
    isActive: true
  };
  
  const createdCategory = await storage.createCategory(newCategory);
  return createdCategory.id;
}

function getFirstImageUrl(pictureField: string): string {
  if (!pictureField) return '';
  
  // Если есть несколько URL разделенных запятыми, берем первый
  const urls = pictureField.split(',').map(url => url.trim());
  const firstUrl = urls[0];
  
  // Проверяем что это валидный URL
  if (firstUrl && (firstUrl.startsWith('http://') || firstUrl.startsWith('https://'))) {
    return firstUrl;
  }
  
  return '';
}

async function importTSSProducts() {
  console.log('🚀 Начинаем импорт товаров TSS.RU...');
  
  const storage = new DatabaseStorage();
  
  try {
    // Читаем CSV файл
    const csvPath = path.join(process.cwd(), 'attached_assets', 'products (2)_1752679653734.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Парсим CSV
    const records: TSSProduct[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`📊 Найдено ${records.length} товаров в CSV файле`);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    // Обрабатываем товары порциями по 50
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`📦 Обрабатываем порцию ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
      
      const productsToImport: InsertProduct[] = [];
      
      for (const record of batch) {
        try {
          // Пропускаем товары без названия
          if (!record.name || !record.name.trim()) {
            skippedCount++;
            continue;
          }
          
          const productName = cleanText(record.name);
          const description = cleanText(record.description || productName);
          const price = extractPrice(record.price);
          
          // Определяем категорию
          const categoryName = getCategoryFromName(productName);
          const categoryId = await createCategoryIfNotExists(storage, categoryName);
          
          // Получаем первое изображение
          const imageUrl = getFirstImageUrl(record.picture);
          
          const productData: InsertProduct = {
            name: productName,
            sku: record.id || `TSS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            slug: generateSlug(productName),
            description: description,
            shortDescription: description.substring(0, 200),
            price: price.toString(),
            originalPrice: null,
            imageUrl: imageUrl,
            categoryId: categoryId,
            stock: null,
            isActive: true,
            isFeatured: false,
            tag: 'tss'
          };
          
          productsToImport.push(productData);
          
        } catch (error) {
          console.error(`❌ Ошибка обработки товара ${record.name}:`, error);
          skippedCount++;
        }
      }
      
      // Импортируем порцию
      if (productsToImport.length > 0) {
        try {
          const result = await storage.bulkImportProducts(productsToImport);
          importedCount += result.success;
          skippedCount += result.failed;
          console.log(`✅ Импортировано: ${result.success}, Пропущено: ${result.failed}`);
        } catch (error) {
          console.error('❌ Ошибка импорта порции:', error);
          skippedCount += productsToImport.length;
        }
      }
      
      // Небольшая пауза между порциями
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Импорт завершен!`);
    console.log(`✅ Успешно импортировано: ${importedCount} товаров`);
    console.log(`⚠️ Пропущено: ${skippedCount} товаров`);
    console.log(`📊 Общий процент успеха: ${Math.round((importedCount / records.length) * 100)}%`);
    
  } catch (error) {
    console.error('💥 Критическая ошибка при импорте:', error);
  }
}

// Запускаем импорт
importTSSProducts()
  .then(() => {
    console.log('🏁 Импорт завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
  });

export { importTSSProducts };