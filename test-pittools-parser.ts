import { parsePittoolsCSV } from './server/utils/pittools-csv-parser';

async function testPittoolsParser() {
  try {
    console.log('Тестирование специализированного парсера pittools...');
    
    // Test with the latest file
    const products = await parsePittoolsCSV('./attached_assets/3385076--pittools.ru (1)_1750687072786.csv');
    
    console.log(`\nРезультаты теста:`);
    console.log(`- Всего товаров: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\nПервые 3 товара:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Категория: ${product.categoryName}`);
        console.log(`   Цена: ${product.price} ${product.currency}`);
        console.log(`   SKU: ${product.sku}`);
        console.log('');
      });
      
      // Check unique categories
      const categories = [...new Set(products.map(p => p.categoryName))];
      console.log(`\nУникальных категорий: ${categories.length}`);
      console.log('Примеры категорий:');
      categories.slice(0, 10).forEach(cat => console.log(`- ${cat}`));
    }
    
  } catch (error) {
    console.error('Ошибка тестирования:', error);
  }
}

testPittoolsParser();