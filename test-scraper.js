// Test the web scraping system with real supplier data
const { scrapeSupplierCatalog, SUPPLIERS } = require('./server/utils/web-scraper.ts');

async function testSupplierScraping() {
  console.log('Тестирование системы парсинга каталогов поставщиков...\n');
  
  // Test FUBAG supplier
  const fubagSupplier = SUPPLIERS.find(s => s.id === 'fubag');
  if (fubagSupplier) {
    console.log(`Тестируем поставщика: ${fubagSupplier.name}`);
    console.log(`Базовый URL: ${fubagSupplier.baseUrl}`);
    console.log(`Каталоги: ${fubagSupplier.catalogUrls.join(', ')}\n`);
    
    try {
      const result = await scrapeSupplierCatalog('fubag');
      console.log(`Результат парсинга:`);
      console.log(`Успех: ${result.success}`);
      console.log(`Найдено товаров: ${result.products.length}`);
      
      if (result.products.length > 0) {
        console.log('\nПример товаров:');
        result.products.slice(0, 3).forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   Артикул: ${product.sku}`);
          console.log(`   Категория: ${product.category}`);
          console.log(`   Описание: ${product.description.substring(0, 100)}...`);
          console.log('');
        });
      }
      
      if (result.error) {
        console.log(`Ошибка: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`Ошибка тестирования: ${error.message}`);
    }
  }
}

testSupplierScraping().catch(console.error);