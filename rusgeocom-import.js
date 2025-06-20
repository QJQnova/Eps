// Импорт всех товаров с сайта rostov.rusgeocom.ru
import https from 'https';
import { Buffer } from 'buffer';

const RUSGEOCOM_URLS = [
  'https://rostov.rusgeocom.ru/',
  'https://rostov.rusgeocom.ru/catalog/',
  'https://rostov.rusgeocom.ru/catalog/geotexniki/',
  'https://rostov.rusgeocom.ru/catalog/geodezicheskie-instrumenty/',
  'https://rostov.rusgeocom.ru/catalog/izmeritelnye-instrumenty/',
  'https://rostov.rusgeocom.ru/catalog/laboratornoe-oborudovanie/'
];

async function importFromRusgeocom() {
  console.log('🚀 ИМПОРТ ТОВАРОВ С RUSGEOCOM');
  console.log('📍 Сайт: https://rostov.rusgeocom.ru/');
  console.log('⚡ Извлекаем ВСЮ информацию о товарах\n');

  let totalProducts = 0;
  const allProducts = [];

  for (const url of RUSGEOCOM_URLS) {
    console.log(`\n📄 Парсинг страницы: ${url}`);
    
    try {
      const html = await fetchPage(url);
      if (!html || html.length < 1000) {
        console.log('   ❌ Недостаточно контента');
        continue;
      }

      console.log(`   ✅ HTML получен (${html.length} символов)`);
      
      const products = await extractProductsWithClaude(html, url);
      if (products.length > 0) {
        console.log(`   🎯 Найдено товаров: ${products.length}`);
        allProducts.push(...products);
        totalProducts += products.length;

        // Показываем примеры товаров
        products.slice(0, 3).forEach((product, i) => {
          console.log(`   ${i + 1}. ${product.name} | ${product.sku} | ${product.price}`);
        });
      } else {
        console.log('   ⚠️ Товары не найдены');
      }

      await delay(2000); // Пауза между запросами
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 ИТОГО НАЙДЕНО: ${totalProducts} товаров`);
  
  if (totalProducts > 0) {
    console.log('\n📤 Импортируем товары в базу данных...');
    await importToDatabase(allProducts);
  }
}

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusText}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Timeout')));
    req.end();
  });
}

async function extractProductsWithClaude(htmlContent, sourceUrl) {
  // Очищаем HTML для анализа
  let cleaned = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > 12000) {
    cleaned = cleaned.substring(0, 12000);
  }

  const base64Html = Buffer.from(cleaned, 'utf8').toString('base64');

  const prompt = `Анализируй HTML страницу компании RUSGEOCOM (геодезические и измерительные инструменты) и извлеки ВСЮ информацию о товарах.

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ:
- name: полное название товара (русский)
- sku: артикул/код товара (обязателен!)
- price: цена в рублях или "По запросу"
- category: категория ("Геодезические инструменты", "Измерительные приборы", etc)
- description: полное описание товара
- imageUrl: URL изображения товара

ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (если доступны):
- originalPrice: старая цена (при скидке)
- shortDescription: краткое описание
- specifications: технические характеристики
- imageUrls: все изображения (массив)
- brand: бренд/производитель
- model: модель
- warranty: гарантия
- availability: наличие ("В наличии", "Под заказ")
- stock: количество
- features: особенности товара (массив)

Верни ТОЛЬКО валидный JSON массив:
[{
  "name": "Теодолит электронный Topcon DT-209",
  "sku": "DT-209",
  "price": "89990",
  "category": "Геодезические инструменты",
  "description": "Электронный теодолит с высокой точностью измерений",
  "shortDescription": "Профессиональный теодолит",
  "specifications": "Точность: 9 угловых секунд",
  "imageUrl": "https://rostov.rusgeocom.ru/images/dt209.jpg",
  "brand": "Topcon",
  "model": "DT-209",
  "warranty": "2 года",
  "availability": "В наличии",
  "features": ["Высокая точность", "Электронный дисплей"]
}]

HTML (base64): ${base64Html}`;

  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            const content = response.content[0].text;

            // Извлекаем JSON массив из ответа
            const jsonMatch = content.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              const products = JSON.parse(jsonMatch[0]);
              // Фильтруем валидные товары с обязательными полями
              const validProducts = products.filter(p => 
                p.name && p.sku && 
                p.name.trim().length > 0 && 
                p.sku.trim().length > 0
              ).map(p => ({
                ...p,
                sourceUrl: sourceUrl
              }));
              resolve(validProducts);
            } else {
              console.log('   ⚠️ JSON не найден в ответе Claude');
              resolve([]);
            }
          } catch (e) {
            console.log('   ⚠️ Ошибка парсинга JSON:', e.message);
            resolve([]);
          }
        } else {
          reject(new Error(`Claude API: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function importToDatabase(products) {
  try {
    const importData = products.map(product => ({
      name: product.name,
      sku: product.sku,
      slug: product.name.toLowerCase()
        .replace(/[^a-zа-я0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      description: product.description || `Геодезический инструмент ${product.name}`,
      shortDescription: product.shortDescription || product.description?.substring(0, 200) || product.name,
      price: product.price && product.price !== 'По запросу' ? product.price : "0",
      originalPrice: product.originalPrice || null,
      imageUrl: product.imageUrl || '',
      stock: product.stock || null,
      categoryId: 46, // Категория "Инструменты"
      isActive: true,
      isFeatured: false,
      tag: `rusgeocom|brand:${product.brand || 'RUSGEOCOM'}|model:${product.model || 'standard'}|warranty:${product.warranty || '1 год'}|availability:${product.availability || 'По запросу'}${product.specifications ? '|specs:' + product.specifications.substring(0, 100) : ''}${product.features ? '|features:' + product.features.join(',') : ''}`
    }));

    // Отправляем данные в API
    const response = await fetch('http://localhost:5000/api/products/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ products: importData })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Успешно импортировано: ${result.success} товаров`);
      if (result.failed > 0) {
        console.log(`⚠️ Не удалось импортировать: ${result.failed} товаров`);
      }
    } else {
      console.log(`❌ Ошибка импорта: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка при импорте: ${error.message}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Запускаем импорт
importFromRusgeocom().catch(console.error);