import { parse } from 'csv-parse';
import { DatabaseStorage } from './server/storage';
import { readFileSync } from 'fs';
import { InsertProduct, InsertCategory } from './shared/schema';

interface DCKProduct {
  articleCode: string;  // Артикул
  nomenclature: string; // Номенклатура (описание)
  rrp: string;         // РРЦ (цена)
  category: string;    // Категория
  photo?: string;      // Фото (если есть)
}

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
    return 1000; // Цена по умолчанию для товаров без цены
  }
  const cleaned = String(priceText).replace(/[^\d.,]/g, '');
  const price = parseFloat(cleaned.replace(',', '.'));
  return isNaN(price) ? 1000 : price;
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
  return `https://dck-tools.ru/images/products/${articleCode.toLowerCase()}.jpg`;
}

async function importAllDCKProducts() {
  const storage = new DatabaseStorage();
  
  try {
    console.log('🚀 Начинаем полный импорт товаров DCK...');
    
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

        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let noPriceCount = 0;
        const categoryMap = new Map<string, number>();
        const processedArticles = new Set<string>();

        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          try {
            const articleCode = cleanText(record['Артикул'] || record['articleCode']);
            const nomenclature = cleanText(record['Номенклатура'] || record['nomenclature']);
            const rrp = cleanText(record['РРЦ'] || record['rrp']);
            const category = cleanText(record['Категория'] || record['category']);
            const photo = cleanText(record['Фото'] || record['photo']);

            console.log(`\n📦 Обрабатываю запись ${i + 1}/${records.length}: ${articleCode}`);

            // Проверяем обязательные поля
            if (!articleCode || !nomenclature || !category) {
              console.log(`⚠️ Пропускаю запись с неполными данными: ${articleCode || 'Без артикула'}`);
              skippedCount++;
              continue;
            }

            // Проверяем дубликаты в текущей сессии
            if (processedArticles.has(articleCode)) {
              console.log(`⚠️ Дубликат артикула в файле: ${articleCode}`);
              skippedCount++;
              continue;
            }

            // Получаем или создаем категорию
            let categoryId: number;
            if (categoryMap.has(category)) {
              categoryId = categoryMap.get(category)!;
            } else {
              categoryId = await createCategoryIfNotExists(storage, category);
              categoryMap.set(category, categoryId);
            }

            // Проверяем, не существует ли уже товар с таким артикулом
            const existingProducts = await storage.searchProducts({
              query: articleCode,
              page: 1,
              limit: 1,
              sort: 'featured'
            });

            if (existingProducts.products.some(p => p.sku === articleCode)) {
              console.log(`⚠️ Товар с артикулом ${articleCode} уже существует, пропускаем...`);
              skippedCount++;
              continue;
            }

            const price = extractPrice(rrp);
            if (!rrp || rrp.trim() === '') {
              noPriceCount++;
              console.log(`⚠️ Товар без цены: ${articleCode}, устанавливаю цену по умолчанию: ${price} руб.`);
            }

            // Создаем товар
            const productData: InsertProduct = {
              sku: articleCode,
              name: nomenclature,
              slug: generateSlug(`${nomenclature}-${articleCode}`),
              description: `${nomenclature}\n\nАртикул: ${articleCode}\nКатегория: ${category}`,
              shortDescription: category,
              price: price.toString(),
              originalPrice: null,
              imageUrl: photo || generateImageUrl(articleCode),
              stock: 10,
              categoryId: categoryId,
              isActive: true,
              isFeatured: Math.random() > 0.8,
              tag: 'DCK'
            };

            await storage.createProduct(productData);
            processedArticles.add(articleCode);
            successCount++;

            console.log(`✅ Добавлен товар: ${articleCode} - ${price} руб.`);

          } catch (error: any) {
            errorCount++;
            console.error(`❌ Ошибка обработки записи ${i + 1}: ${error.message}`);
            
            if (errorCount > 20) {
              console.error('❌ Слишком много ошибок, прерываем импорт');
              reject(error);
              return;
            }
          }
        }

        console.log(`\n🎉 Импорт завершен!`);
        console.log(`   📦 Успешно импортировано: ${successCount} товаров`);
        console.log(`   📂 Создано категорий: ${categoryMap.size}`);
        console.log(`   ⚠️ Пропущено: ${skippedCount} товаров`);
        console.log(`   💰 Товаров без цены: ${noPriceCount}`);
        console.log(`   ❌ Ошибок: ${errorCount}`);
        console.log(`   📊 Всего записей в CSV: ${records.length}`);
        
        // Проверяем итоговое количество товаров в базе
        const finalProducts = await storage.searchProducts({
          query: '',
          page: 1,
          limit: 1,
          sort: 'featured'
        });
        console.log(`   🗄️ Общее количество товаров в базе: ${finalProducts.total}`);
        
        resolve();
      });
    });

  } catch (error: any) {
    console.error('❌ Критическая ошибка импорта:', error.message);
    throw error;
  }
}

// Запускаем импорт
async function main() {
  try {
    await importAllDCKProducts();
    console.log('🎉 Импорт товаров DCK успешно завершен!');
    process.exit(0);
  } catch (error: any) {
    console.error('💥 Импорт завершился с ошибкой:', error.message);
    process.exit(1);
  }
}

main();