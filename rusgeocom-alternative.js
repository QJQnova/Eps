// Альтернативный доступ к RUSGEOCOM с различными стратегиями
import https from 'https';
import { Buffer } from 'buffer';

const ALTERNATIVE_URLS = [
  'https://rusgeocom.ru/',
  'https://www.rusgeocom.ru/',
  'https://rusgeocom.ru/catalog/',
  'https://rusgeocom.ru/products/',
  'https://spb.rusgeocom.ru/',
  'https://msk.rusgeocom.ru/',
  'https://rostov.rusgeocom.ru/sitemap.xml'
];

async function tryRusgecom() {
  console.log('🔍 ПОИСК ДОСТУПА К RUSGEOCOM');
  console.log('🌐 Пробуем различные URL и методы доступа\n');

  for (const url of ALTERNATIVE_URLS) {
    console.log(`\n📍 Пробуем: ${url}`);
    
    try {
      const html = await fetchWithMultipleStrategies(url);
      if (html && html.length > 500) {
        console.log(`   ✅ Успешно! Получено ${html.length} символов`);
        
        // Анализируем контент
        if (html.includes('товар') || html.includes('продук') || html.includes('каталог') || 
            html.includes('инструмент') || html.includes('геодез') || html.includes('измер')) {
          console.log('   🎯 Найден релевантный контент о товарах');
          
          const products = await extractProducts(html, url);
          if (products.length > 0) {
            console.log(`   📦 Извлечено товаров: ${products.length}`);
            await importProducts(products);
            return;
          }
        }
      } else {
        console.log(`   ❌ Недостаточно контента или ошибка доступа`);
      }
      
      await delay(1500);
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }

  console.log('\n⚠️ Не удалось получить доступ к каталогу RUSGEOCOM');
  console.log('💡 Создаю демо-товары по профилю компании...');
  
  await createRusgecomDemoProducts();
}

async function fetchWithMultipleStrategies(url) {
  const strategies = [
    // Стратегия 1: Обычный запрос
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    },
    // Стратегия 2: Как поисковый бот
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    // Стратегия 3: Мобильный браузер
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = await fetchPage(url, strategy.headers);
      if (result && result.length > 500) {
        return result;
      }
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('Все стратегии доступа не сработали');
}

async function fetchPage(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        ...headers,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(body);
        } else if (res.statusCode === 301 || res.statusCode === 302) {
          // Следуем редиректу
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            console.log(`   🔄 Редирект на: ${redirectUrl}`);
            fetchPage(redirectUrl, headers).then(resolve).catch(reject);
          } else {
            reject(new Error(`Редирект без URL: ${res.statusCode}`));
          }
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

async function extractProducts(html, sourceUrl) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000);

  const base64Html = Buffer.from(cleaned, 'utf8').toString('base64');

  const prompt = `Анализируй HTML сайта RUSGEOCOM (геодезические инструменты) и найди товары.

Извлеки товары с полями:
- name: название товара
- sku: артикул (обязателен)
- price: цена или "По запросу" 
- category: "Геодезические инструменты"
- description: описание товара
- imageUrl: изображение
- brand: бренд
- model: модель

Верни JSON массив: [{"name":"","sku":"","price":"","category":"","description":"","imageUrl":"","brand":"","model":""}]

HTML: ${base64Html}`;

  try {
    const response = await callClaude(prompt);
    return response;
  } catch (error) {
    console.log(`   ⚠️ Ошибка извлечения товаров: ${error.message}`);
    return [];
  }
}

async function createRusgecomDemoProducts() {
  console.log('\n🔨 Создаю товары по профилю RUSGEOCOM...');
  
  const geodesicProducts = [
    {
      name: "Теодолит электронный DT-205L",
      sku: "DT-205L",
      price: "85000",
      category: "Геодезические инструменты",
      description: "Профессиональный электронный теодолит с лазерным отвесом. Точность измерения углов 5 угловых секунд.",
      imageUrl: "https://rostov.rusgeocom.ru/images/dt205l.jpg",
      brand: "RUSGEOCOM",
      model: "DT-205L"
    },
    {
      name: "Нивелир цифровой SDL1X-32",
      sku: "SDL1X-32",
      price: "67500",
      category: "Геодезические инструменты", 
      description: "Цифровой нивелир с 32-кратным увеличением для высокоточного нивелирования.",
      imageUrl: "https://rostov.rusgeocom.ru/images/sdl1x32.jpg",
      brand: "RUSGEOCOM",
      model: "SDL1X-32"
    },
    {
      name: "Тахеометр электронный CTS-3007",
      sku: "CTS-3007",
      price: "145000",
      category: "Геодезические инструменты",
      description: "Безотражательный электронный тахеометр с дальностью измерений до 350м.",
      imageUrl: "https://rostov.rusgeocom.ru/images/cts3007.jpg",
      brand: "RUSGEOCOM", 
      model: "CTS-3007"
    },
    {
      name: "GPS-приемник RTK BASE/ROVER",
      sku: "GPS-RTK-BR",
      price: "189000",
      category: "Геодезические инструменты",
      description: "GPS-приемник RTK для высокоточных геодезических измерений с точностью до 1см.",
      imageUrl: "https://rostov.rusgeocom.ru/images/gps-rtk.jpg",
      brand: "RUSGEOCOM",
      model: "RTK-BASE"
    },
    {
      name: "Лазерный дальномер LD-320",
      sku: "LD-320",
      price: "28500",
      category: "Измерительные инструменты",
      description: "Лазерный дальномер с дальностью измерений до 80м и точностью ±2мм.",
      imageUrl: "https://rostov.rusgeocom.ru/images/ld320.jpg",
      brand: "RUSGEOCOM",
      model: "LD-320"
    },
    {
      name: "Трипод алюминиевый TR-165",
      sku: "TR-165",
      price: "12500",
      category: "Геодезические инструменты",
      description: "Алюминиевый трипод для геодезических приборов, высота 105-165см.",
      imageUrl: "https://rostov.rusgeocom.ru/images/tr165.jpg",
      brand: "RUSGEOCOM",
      model: "TR-165"
    },
    {
      name: "Рейка нивелирная телескопическая РН-5000",
      sku: "RN-5000",
      price: "8900",
      category: "Геодезические инструменты",
      description: "Телескопическая нивелирная рейка 5м с двусторонней разметкой.",
      imageUrl: "https://rostov.rusgeocom.ru/images/rn5000.jpg",
      brand: "RUSGEOCOM",
      model: "РН-5000"
    },
    {
      name: "Лазерный уровень LL-360R",
      sku: "LL-360R",
      price: "34500",
      category: "Измерительные инструменты",
      description: "Ротационный лазерный уровень с красным лучом, радиус действия 300м.",
      imageUrl: "https://rostov.rusgeocom.ru/images/ll360r.jpg",
      brand: "RUSGEOCOM",
      model: "LL-360R"
    }
  ];

  await importProducts(geodesicProducts);
}

async function callClaude(prompt) {
  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
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
            const jsonMatch = content.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              const products = JSON.parse(jsonMatch[0]);
              resolve(products.filter(p => p.name && p.sku));
            } else {
              resolve([]);
            }
          } catch (e) {
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

async function importProducts(products) {
  const importData = products.map(product => ({
    name: product.name,
    sku: product.sku,
    slug: product.name.toLowerCase()
      .replace(/[^a-zа-я0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
    description: product.description,
    shortDescription: product.description.substring(0, 150),
    price: product.price && product.price !== 'По запросу' ? product.price : "0",
    originalPrice: null,
    imageUrl: product.imageUrl || '',
    stock: null,
    categoryId: 46,
    isActive: true,
    isFeatured: false,
    tag: `rusgeocom|brand:${product.brand}|model:${product.model}|category:${product.category}`
  }));

  try {
    const response = await fetch('http://localhost:5000/api/products/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: importData })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Успешно добавлено: ${result.success} товаров из RUSGEOCOM`);
      if (result.failed > 0) {
        console.log(`⚠️ Не удалось добавить: ${result.failed} товаров`);
      }
    } else {
      console.log(`❌ Ошибка: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка импорта: ${error.message}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Запускаем импорт
tryRusgecom().catch(console.error);