// Добавление товаров RUSGEOCOM через авторизованный API
import http from 'http';

async function addRusgecomProducts() {
  console.log('Добавление товаров RUSGEOCOM в каталог ЭПС...\n');

  // Авторизуемся в системе
  const sessionCookie = await login();
  if (!sessionCookie) {
    console.log('Ошибка авторизации');
    return;
  }

  // Геодезические инструменты и оборудование RUSGEOCOM
  const rusgecomProducts = [
    {
      name: "Теодолит электронный DT-205L RUSGEOCOM",
      sku: "RUSGEOCOM-DT205L",
      price: "85000",
      description: "Профессиональный электронный теодолит с лазерным отвесом. Точность измерения углов 5 угловых секунд. Дальность измерений до 1500м. Компенсатор наклона двух осей.",
      shortDescription: "Электронный теодолит с лазерным отвесом",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:DT-205L|warranty:2 года|availability:В наличии"
    },
    {
      name: "Нивелир цифровой SDL1X-32 RUSGEOCOM",
      sku: "RUSGEOCOM-SDL1X32",
      price: "67500",
      description: "Цифровой нивелир с 32-кратным увеличением для высокоточного нивелирования. Точность на 1км двойного хода ±0.7мм. Минимальная дистанция фокусировки 0.6м.",
      shortDescription: "Цифровой нивелир 32x увеличение",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:SDL1X-32|warranty:2 года|availability:В наличии"
    },
    {
      name: "Тахеометр электронный CTS-3007 RUSGEOCOM",
      sku: "RUSGEOCOM-CTS3007",
      price: "145000",
      description: "Безотражательный электронный тахеометр с дальностью измерений до 350м без отражателя и до 2000м с отражателем. Точность измерения углов 7 угловых секунд.",
      shortDescription: "Безотражательный электронный тахеометр",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:CTS-3007|warranty:2 года|availability:В наличии"
    },
    {
      name: "GPS-приемник RTK BASE/ROVER RUSGEOCOM",
      sku: "RUSGEOCOM-GPSRTK",
      price: "189000",
      description: "GPS-приемник RTK для высокоточных геодезических измерений с точностью до 1см в плане и 2см по высоте. Поддержка GPS, GLONASS, BeiDou, Galileo.",
      shortDescription: "GPS-приемник RTK высокая точность",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1446776876153-9a7c8e7b73d7?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:RTK-BASE|warranty:2 года|availability:В наличии"
    },
    {
      name: "Лазерный дальномер LD-320 RUSGEOCOM",
      sku: "RUSGEOCOM-LD320",
      price: "28500",
      description: "Лазерный дальномер с дальностью измерений до 80м и точностью ±2мм. Функции: измерение расстояния, площади, объема. Память на 20 измерений.",
      shortDescription: "Лазерный дальномер до 80м",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:LD-320|warranty:1 год|availability:В наличии"
    },
    {
      name: "Трипод алюминиевый TR-165 RUSGEOCOM",
      sku: "RUSGEOCOM-TR165",
      price: "12500",
      description: "Алюминиевый трипод для геодезических приборов, высота регулировки 105-165см. Максимальная нагрузка 5кг. Быстрозажимные ноги.",
      shortDescription: "Алюминиевый трипод для приборов",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:TR-165|warranty:1 год|availability:В наличии"
    },
    {
      name: "Рейка нивелирная телескопическая РН-5000 RUSGEOCOM",
      sku: "RUSGEOCOM-RN5000",
      price: "8900",
      description: "Телескопическая нивелирная рейка 5м с двусторонней разметкой. Материал: алюминий. Деления: сантиметровые с миллиметровыми подразделениями.",
      shortDescription: "Телескопическая нивелирная рейка 5м",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1493126406671-714991ba2c49?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:РН-5000|warranty:1 год|availability:В наличии"
    },
    {
      name: "Лазерный уровень ротационный LL-360R RUSGEOCOM",
      sku: "RUSGEOCOM-LL360R",
      price: "34500",
      description: "Ротационный лазерный уровень с красным лучом, радиус действия 300м. Самовыравнивание в диапазоне ±3°. Скорость вращения 0-600 об/мин.",
      shortDescription: "Ротационный лазерный уровень 300м",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1581093804475-577d72e38aa0?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:LL-360R|warranty:2 года|availability:В наличии"
    },
    {
      name: "Призма отражательная с держателем RUSGEOCOM",
      sku: "RUSGEOCOM-PRISM",
      price: "15800",
      description: "Призма отражательная с постоянной призмы 0мм. Точность центрирования ±0.5мм. В комплекте: призма, держатель, футляр для транспортировки.",
      shortDescription: "Призма отражательная с держателем",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:PRISM-30|warranty:1 год|availability:В наличии"
    },
    {
      name: "Буссоль геодезическая БГ-1 RUSGEOCOM",
      sku: "RUSGEOCOM-BG1",
      price: "22300",
      description: "Геодезическая буссоль для определения магнитных азимутов направлений. Цена деления лимба 1°. Точность отсчета по лимбу ±5′.",
      shortDescription: "Геодезическая буссоль БГ-1",
      categoryId: 46,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      tag: "rusgeocom|brand:RUSGEOCOM|model:БГ-1|warranty:1 год|availability:В наличии"
    }
  ];

  const importData = rusgecomProducts.map(product => ({
    name: product.name,
    sku: product.sku,
    slug: product.name.toLowerCase()
      .replace(/[^a-zа-я0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    originalPrice: null,
    imageUrl: product.imageUrl,
    stock: null,
    categoryId: product.categoryId,
    isActive: true,
    isFeatured: false,
    tag: product.tag
  }));

  try {
    const result = await makeAuthenticatedRequest('/api/products/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({ products: importData })
    });

    if (result.success) {
      console.log(`✅ Успешно добавлено ${result.success} товаров RUSGEOCOM`);
      if (result.failed > 0) {
        console.log(`⚠️ Не удалось добавить: ${result.failed} товаров`);
      }
      console.log('\n🎯 Товары RUSGEOCOM добавлены в каталог ЭПС');
    } else {
      console.log(`❌ Ошибка: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка добавления товаров: ${error.message}`);
  }
}

async function login() {
  const loginData = JSON.stringify({
    username: 'QQJFie',
    password: 'admin123'
  });

  try {
    const response = await makeRequest('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      },
      body: loginData
    });

    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid='));
      return sessionCookie ? sessionCookie.split(';')[0] : null;
    }
    return null;
  } catch (error) {
    console.log(`Ошибка авторизации: ${error.message}`);
    return null;
  }
}

async function makeRequest(path, options) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: options.method,
      headers: options.headers,
      rejectUnauthorized: false
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function makeAuthenticatedRequest(path, options) {
  const response = await makeRequest(path, options);
  
  if (response.statusCode === 200) {
    return JSON.parse(response.body);
  } else {
    throw new Error(`HTTP ${response.statusCode}: ${response.body}`);
  }
}

// Запускаем добавление товаров
addRusgecomProducts().catch(console.error);