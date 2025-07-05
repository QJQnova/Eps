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
  const cleaned = String(priceText).replace(/[^\d.,]/g, '');
  const price = parseFloat(cleaned.replace(',', '.'));
  return isNaN(price) ? 0 : price;
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
  // Генерируем URL изображения на основе артикула
  return `https://dck-tools.ru/images/products/${articleCode.toLowerCase()}.jpg`;
}

async function importDCKProducts() {
  const storage = new DatabaseStorage();
  
  try {
    console.log('🚀 Начинаем импорт товаров DCK...');
    
    // Читаем CSV файл
    const csvContent = readFileSync('./attached_assets/Prai_774_s_list_DCK_19_06_25 (2)_1751678834105.csv', 'utf-8');
    
    return new Promise<void>((resolve, reject) => {
      const products: DCKProduct[] = [];
      
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
        let errorCount = 0;
        const categoryMap = new Map<string, number>();

        for (const record of records) {
          try {
            const articleCode = cleanText(record['Артикул'] || record['articleCode']);
            const nomenclature = cleanText(record['Номенклатура'] || record['nomenclature']);
            const rrp = cleanText(record['РРЦ'] || record['rrp']);
            const category = cleanText(record['Категория'] || record['category']);
            const photo = cleanText(record['Фото'] || record['photo']);

            // Проверяем обязательные поля
            if (!articleCode || !nomenclature || !rrp || !category) {
              console.log(`⚠️ Пропускаем запись с неполными данными: ${articleCode || 'Без артикула'}`);
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
              continue;
            }

            const price = extractPrice(rrp);
            if (price <= 0) {
              console.log(`⚠️ Некорректная цена для товара ${articleCode}: ${rrp}`);
              continue;
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
              stock: 10, // По умолчанию в наличии
              categoryId: categoryId,
              isActive: true,
              isFeatured: Math.random() > 0.8, // 20% товаров делаем рекомендуемыми
              tag: 'DCK'
            };

            await storage.createProduct(productData);
            successCount++;

            if (successCount % 10 === 0) {
              console.log(`📦 Обработано ${successCount} товаров...`);
            }

          } catch (error: any) {
            errorCount++;
            console.error(`❌ Ошибка обработки записи:`, error.message);
            
            if (errorCount > 10) {
              console.error('❌ Слишком много ошибок, прерываем импорт');
              reject(error);
              return;
            }
          }
        }

        console.log(`\n✅ Импорт завершен:`);
        console.log(`   📦 Успешно импортировано: ${successCount} товаров`);
        console.log(`   📂 Создано категорий: ${categoryMap.size}`);
        console.log(`   ❌ Ошибок: ${errorCount}`);
        
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
    await importDCKProducts();
    console.log('🎉 Импорт товаров DCK успешно завершен!');
    process.exit(0);
  } catch (error: any) {
    console.error('💥 Импорт завершился с ошибкой:', error.message);
    process.exit(1);
  }
}

main();