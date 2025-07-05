import { parse } from 'csv-parse';
import { DatabaseStorage } from './server/storage';
import { readFileSync } from 'fs';

async function analyzeMissingProducts() {
  const storage = new DatabaseStorage();
  
  try {
    console.log('🔍 Анализируем пропущенные товары...');
    
    // Читаем CSV файл
    const csvContent = readFileSync('./attached_assets/Prai_774_s_list_DCK_19_06_25 (2)_1751678834105.csv', 'utf-8');
    
    // Получаем все товары из базы
    const allProducts = await storage.searchProducts({
      query: '',
      page: 1,
      limit: 1000,
      sort: 'featured'
    });
    
    const existingSKUs = new Set(allProducts.products.map(p => p.sku));
    
    return new Promise<void>((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      }, (err, records) => {
        if (err) {
          console.error('❌ Ошибка парсинга CSV:', err);
          reject(err);
          return;
        }

        console.log(`📋 Всего в CSV: ${records.length} записей`);
        console.log(`🗄️ Всего в базе: ${allProducts.total} товаров`);

        let missingCount = 0;
        let existingCount = 0;
        let emptyPriceCount = 0;
        let emptyDataCount = 0;

        records.forEach((record, i) => {
          const articleCode = String(record['Артикул'] || '').trim();
          const nomenclature = String(record['Номенклатура'] || '').trim();
          const rrp = String(record['РРЦ'] || '').trim();
          const category = String(record['Категория'] || '').trim();

          if (!articleCode || !nomenclature || !category) {
            emptyDataCount++;
            console.log(`⚠️ Строка ${i + 1}: Пустые данные - ${articleCode || 'Без артикула'}`);
            return;
          }

          if (!rrp || rrp === '') {
            emptyPriceCount++;
            console.log(`💰 Строка ${i + 1}: Нет цены - ${articleCode} (${nomenclature})`);
          }

          if (existingSKUs.has(articleCode)) {
            existingCount++;
          } else {
            missingCount++;
            console.log(`❌ Отсутствует: ${articleCode} - ${nomenclature} - ${rrp || 'Без цены'}`);
          }
        });

        console.log(`\n📊 Итоговая статистика:`);
        console.log(`   📝 Записей в CSV: ${records.length}`);
        console.log(`   ✅ Товаров уже в базе: ${existingCount}`);
        console.log(`   ❌ Отсутствует в базе: ${missingCount}`);
        console.log(`   💰 Товаров без цены: ${emptyPriceCount}`);
        console.log(`   ⚠️ Записей с пустыми данными: ${emptyDataCount}`);
        console.log(`   🎯 Процент покрытия: ${Math.round((existingCount / records.length) * 100)}%`);

        resolve();
      });
    });

  } catch (error: any) {
    console.error('❌ Ошибка анализа:', error.message);
    throw error;
  }
}

analyzeMissingProducts()
  .then(() => {
    console.log('✅ Анализ завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error.message);
    process.exit(1);
  });