import { parse } from 'csv-parse';
import { DatabaseStorage } from './server/storage';
import { readFileSync } from 'fs';
import { InsertProduct, InsertCategory } from './shared/schema';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function cleanText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text).trim().replace(/["']/g, '');
}

function extractPrice(priceText: string): number {
  if (!priceText || priceText.trim() === '') {
    return 1500; // Цена по умолчанию для товаров без цены
  }
  const cleaned = String(priceText).replace(/[^\d.,]/g, '');
  const price = parseFloat(cleaned.replace(',', '.'));
  return isNaN(price) ? 1500 : price;
}

async function createCategoryIfNotExists(storage: DatabaseStorage, categoryName: string): Promise<number> {
  try {
    const existingCategories = await storage.getAllCategories();
    const existing = existingCategories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (existing) {
      return existing.id;
    }

    const newCategory: InsertCategory = {
      name: categoryName,
      slug: generateSlug(categoryName),
      description: `Категория: ${categoryName}`,
    };

    const category = await storage.createCategory(newCategory);
    console.log(`✅ Создана категория: ${categoryName}`);
    return category.id;
  } catch (error: any) {
    console.error(`❌ Ошибка создания категории ${categoryName}:`, error.message);
    throw error;
  }
}

function generateImageUrl(articleCode: string): string {
  return `https://dck-tools.ru/images/products/${articleCode.toLowerCase().replace(/[()]/g, '')}.jpg`;
}

async function importRemainingDCKProducts() {
  const storage = new DatabaseStorage();
  
  try {
    console.log('🚀 Добавляем оставшиеся товары DCK...');
    
    // Получаем список уже существующих товаров
    const existingProducts = await storage.searchProducts({
      query: '',
      page: 1,
      limit: 1000,
      sort: 'featured'
    });
    const existingSKUs = new Set(existingProducts.products.map(p => p.sku));
    
    // Читаем CSV файл
    const csvContent = readFileSync('./attached_assets/Prai_774_s_list_DCK_19_06_25 (2)_1751678834105.csv', 'utf-8');
    
    return new Promise<void>((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      }, async (err, records) => {
        if (err) {
          console.error('❌ Ошибка парсинга CSV:', err);
          reject(err);
          return;
        }

        console.log(`📋 Найдено ${records.length} записей в CSV`);
        console.log(`🗄️ Уже в базе: ${existingSKUs.size} товаров`);

        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const categoryMap = new Map<string, number>();

        // Предварительно загружаем все категории
        const allCategories = await storage.getAllCategories();
        allCategories.forEach(cat => categoryMap.set(cat.name, cat.id));

        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          try {
            const articleCode = cleanText(record['Артикул'] || record['articleCode']);
            const nomenclature = cleanText(record['Номенклатура'] || record['nomenclature']);
            const rrp = cleanText(record['РРЦ'] || record['rrp']);
            const category = cleanText(record['Категория'] || record['category']);
            const photo = cleanText(record['Фото'] || record['photo']);

            // Пропускаем если товар уже существует
            if (existingSKUs.has(articleCode)) {
              skippedCount++;
              continue;
            }

            // Проверяем обязательные поля
            if (!articleCode || !nomenclature || !category) {
              console.log(`⚠️ Пропускаю запись с неполными данными: ${articleCode || 'Без артикула'}`);
              skippedCount++;
              continue;
            }

            console.log(`📦 Добавляю товар ${successCount + 1}: ${articleCode}`);

            // Получаем или создаем категорию
            let categoryId: number;
            if (categoryMap.has(category)) {
              categoryId = categoryMap.get(category)!;
            } else {
              categoryId = await createCategoryIfNotExists(storage, category);
              categoryMap.set(category, categoryId);
            }

            const price = extractPrice(rrp);
            if (!rrp || rrp.trim() === '') {
              console.log(`⚠️ Товар без цены: ${articleCode}, устанавливаю цену: ${price} руб.`);
            }

            // Создаем товар
            const productData: InsertProduct = {
              sku: articleCode,
              name: nomenclature,
              slug: generateSlug(`${nomenclature}-${articleCode}`),
              description: `${nomenclature}\n\nАртикул: ${articleCode}\nКатегория: ${category}${rrp ? `\nЦена: ${price} руб.` : ''}`,
              shortDescription: category,
              price: price.toString(),
              originalPrice: null,
              imageUrl: photo || generateImageUrl(articleCode),
              stock: 10,
              categoryId: categoryId,
              isActive: true,
              isFeatured: Math.random() > 0.85, // 15% товаров делаем рекомендуемыми
              tag: 'DCK'
            };

            await storage.createProduct(productData);
            successCount++;

            console.log(`✅ ${articleCode} - ${price} руб. (${category})`);

            // Каждые 10 товаров показываем прогресс
            if (successCount % 10 === 0) {
              console.log(`📊 Прогресс: добавлено ${successCount} новых товаров`);
            }

          } catch (error: any) {
            errorCount++;
            console.error(`❌ Ошибка товара ${articleCode || 'неизвестен'}: ${error.message}`);
            
            if (errorCount > 10) {
              console.error('❌ Слишком много ошибок, прерываем импорт');
              reject(error);
              return;
            }
          }
        }

        // Проверяем финальное количество товаров
        const finalProducts = await storage.searchProducts({
          query: '',
          page: 1,
          limit: 1,
          sort: 'featured'
        });

        console.log(`\n🎉 Импорт завершен!`);
        console.log(`   ✅ Добавлено новых товаров: ${successCount}`);
        console.log(`   ⚠️ Пропущено: ${skippedCount}`);
        console.log(`   ❌ Ошибок: ${errorCount}`);
        console.log(`   📊 Всего товаров в базе: ${finalProducts.total}`);
        console.log(`   🎯 Покрытие CSV: ${Math.round((finalProducts.total / records.length) * 100)}%`);
        
        resolve();
      });
    });

  } catch (error: any) {
    console.error('❌ Критическая ошибка импорта:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await importRemainingDCKProducts();
    console.log('🎉 Импорт оставшихся товаров DCK завершен!');
    process.exit(0);
  } catch (error: any) {
    console.error('💥 Импорт завершился с ошибкой:', error.message);
    process.exit(1);
  }
}

main();