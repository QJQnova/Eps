import { storage } from './server/storage';
import { realCatalogScraper } from './server/utils/real-catalog-scraper';

async function testDirectImport() {
  console.log('Начинаю прямой тест массового импорта...');
  
  try {
    const result = await realCatalogScraper(
      'https://pittools.ru',
      'P.I.T Tools', 
      'Электроинструмент и садовая техника P.I.T, уже более 20 лет успешно продается на рынке Азии, России, стран СНГ и Европы.'
    );
    
    console.log('Результат импорта:', JSON.stringify(result, null, 2));
    
    // Проверяем количество импортированных товаров
    const products = await storage.getAllProducts();
    console.log(`Всего товаров в базе: ${products.length}`);
    
    if (products.length > 0) {
      console.log('Первые 5 товаров:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.price} руб.`);
      });
    }
    
  } catch (error) {
    console.error('Ошибка тестирования:', error);
  }
}

testDirectImport();