const { realCatalogScraper } = require('./server/utils/real-catalog-scraper.ts');

async function testMassImport() {
  console.log('Тестирую массовый импорт товаров...');
  
  const result = await realCatalogScraper(
    'https://pittools.ru',
    'P.I.T Tools', 
    'Электроинструмент и садовая техника P.I.T, уже более 20 лет успешно продается на рынке Азии, России, стран СНГ и Европы.'
  );
  
  console.log('Результат импорта:', result);
}

testMassImport().catch(console.error);