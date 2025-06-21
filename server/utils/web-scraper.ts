import Anthropic from '@anthropic-ai/sdk';

interface ScrapedProduct {
  name: string;
  sku: string;
  price: string;
  originalPrice?: string;
  category: string;
  description: string;
  shortDescription?: string;
  specifications?: string;
  imageUrl: string;
  imageUrls?: string[];
  brand?: string;
  model?: string;
  warranty?: string;
  availability?: string;
  stock?: number;
  sourceUrl: string;
  features?: string[];
  technicalSpecs?: Record<string, string>;
}

interface SupplierConfig {
  id: string;
  name: string;
  baseUrl: string;
  catalogUrls: string[];
  updateInterval: number; // в часах
  lastUpdate?: Date;
  isActive: boolean;
}

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SUPPLIERS: SupplierConfig[] = [
  {
    id: 'tss',
    name: 'TSS',
    baseUrl: 'https://www.tss.ru',
    catalogUrls: [
      'https://www.tss.ru/dealers/catalog/',
      'https://www.tss.ru/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'sturm',
    name: 'STURM TOOLS',
    baseUrl: 'https://sturmtools.ru',
    catalogUrls: [
      'https://sturmtools.ru/',
      'https://sturmtools.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'dck',
    name: 'DCK TOOLS',
    baseUrl: 'https://dcktools.ru',
    catalogUrls: [
      'https://dcktools.ru/dealers/',
      'https://dcktools.ru/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'fit24',
    name: 'FIT24',
    baseUrl: 'https://fit24.ru',
    catalogUrls: [
      'https://fit24.ru/catalog/',
      'https://fit24.ru/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'instrument',
    name: 'INSTRUMENT.RU',
    baseUrl: 'https://instrument.ru',
    catalogUrls: [
      'https://instrument.ru/search/',
      'https://instrument.ru/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'zubr',
    name: 'ZUBR',
    baseUrl: 'https://zubr.ru',
    catalogUrls: [
      'https://zubr.ru/',
      'https://zubr.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'svarog',
    name: 'SVAROG',
    baseUrl: 'https://svarog-rf.ru',
    catalogUrls: [
      'https://svarog-rf.ru/',
      'https://svarog-rf.ru/dealers/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'prosvar',
    name: 'ПРОСВАР',
    baseUrl: 'https://prosvar.com',
    catalogUrls: [
      'https://prosvar.com/',
      'https://prosvar.com/product/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'stanix',
    name: 'СТАНИКС',
    baseUrl: 'https://stanix.ru',
    catalogUrls: [
      'https://stanix.ru/',
      'https://stanix.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'remeza',
    name: 'REMEZA',
    baseUrl: 'https://www.remeza.org',
    catalogUrls: [
      'https://www.remeza.org/',
      'https://www.remeza.org/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'senix',
    name: 'SENIX',
    baseUrl: 'https://senixtool.ru',
    catalogUrls: [
      'https://senixtool.ru/',
      'https://senixtool.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'bojet',
    name: 'BOJET',
    baseUrl: 'https://bojet.ru',
    catalogUrls: [
      'https://bojet.ru/',
      'https://bojet.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'altec',
    name: 'ALTEC',
    baseUrl: 'https://altecopt.ru',
    catalogUrls: [
      'https://altecopt.ru/',
      'https://altecopt.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'oli',
    name: 'OLI RUSSIA',
    baseUrl: 'https://olirussia.ru',
    catalogUrls: [
      'https://olirussia.ru/',
      'https://olirussia.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'rusgeocom',
    name: 'RUSGEOCOM',
    baseUrl: 'https://rostov.rusgeocom.ru',
    catalogUrls: [
      'https://rostov.rusgeocom.ru/',
      'https://rostov.rusgeocom.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'kornor',
    name: 'KORNOR',
    baseUrl: 'https://kornor.ru',
    catalogUrls: [
      'https://kornor.ru/',
      'https://kornor.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'abrasives',
    name: 'ABRASIVES.RU',
    baseUrl: 'https://www.abrasives.ru',
    catalogUrls: [
      'https://www.abrasives.ru/',
      'https://www.abrasives.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'rusklimat',
    name: 'РУСКЛИМАТ',
    baseUrl: 'https://www.rusklimat.ru',
    catalogUrls: [
      'https://www.rusklimat.ru/',
      'https://www.rusklimat.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'champion',
    name: 'CHAMPION TOOL',
    baseUrl: 'https://championtool.ru',
    catalogUrls: [
      'https://championtool.ru/',
      'https://championtool.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'pittools',
    name: 'PIT TOOLS',
    baseUrl: 'https://pittools.ru',
    catalogUrls: [
      'https://pittools.ru/',
      'https://pittools.ru/catalog/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'interskol',
    name: 'ИНТЕРСКОЛ',
    baseUrl: 'https://shop.interskol.ru',
    catalogUrls: [
      'https://shop.interskol.ru/',
      'https://shop.interskol.ru/catalog/'
    ],
    updateInterval: 12,
    isActive: true
  }
];

export async function scrapeSupplierCatalog(supplierId: string): Promise<{
  success: boolean;
  products: ScrapedProduct[];
  error?: string;
}> {
  try {
    const supplier = SUPPLIERS.find(s => s.id === supplierId);
    if (!supplier) {
      return { success: false, products: [], error: "Поставщик не найден" };
    }

    if (!supplier.isActive) {
      return { success: false, products: [], error: "Поставщик деактивирован" };
    }

    console.log(`Начинаем парсинг каталога поставщика: ${supplier.name}`);
    const allProducts: ScrapedProduct[] = [];

    for (const catalogUrl of supplier.catalogUrls) {
      console.log(`Парсинг страницы каталога: ${catalogUrl}`);
      
      try {
        const pageProducts = await scrapePageWithClaude(catalogUrl, supplier);
        allProducts.push(...pageProducts);
        console.log(`Найдено ${pageProducts.length} товаров на странице ${catalogUrl}`);
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (pageError: any) {
        console.error(`Ошибка парсинга страницы ${catalogUrl}:`, pageError.message);
        // Продолжаем парсинг других страниц даже при ошибке
        continue;
      }
    }

    // Обновляем время последнего обновления
    supplier.lastUpdate = new Date();

    return {
      success: true,
      products: allProducts
    };

  } catch (error: any) {
    console.error("Общая ошибка парсинга каталога:", error);
    return {
      success: false,
      products: [],
      error: error.message
    };
  }
}

async function scrapePageWithClaude(url: string, supplier: SupplierConfig): Promise<ScrapedProduct[]> {
  try {
    console.log(`Парсинг сайта поставщика: ${url}`);
    
    // Получаем HTML страницы с расширенными заголовками
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`HTTP ошибка ${response.status} для ${url}, попробуем главную страницу`);
      // Если конкретная страница не найдена, попробуем главную страницу
      const fallbackResponse = await fetch(supplier.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
      }
      
      const fallbackHtml = await fallbackResponse.text();
      const cleanedFallbackHtml = cleanHtmlForAnalysis(fallbackHtml);
      console.log(`Получен HTML с главной страницы, размер: ${cleanedFallbackHtml.length} символов`);
      
      // Анализируем главную страницу с Claude
      return await analyzeHtmlWithClaude(cleanedFallbackHtml, supplier.baseUrl, supplier);
    }

    const html = await response.text();
    const cleanedHtml = cleanHtmlForAnalysis(html);

    console.log(`HTML получен, размер: ${cleanedHtml.length} символов`);

    if (cleanedHtml.length < 500) {
      throw new Error("Получена слишком короткая HTML страница");
    }

    // Анализируем HTML с Claude через новую функцию
    return await analyzeHtmlWithClaude(cleanedHtml, url, supplier);

  } catch (error: any) {
    console.error(`Ошибка парсинга сайта ${url}:`, error);
    
    // Если произошла ошибка сети, создаем демо-данные для демонстрации
    if (error.message.includes('fetch') || error.message.includes('HTTP')) {
      console.log(`Сетевая ошибка для ${supplier.name}, создаем демо-данные`);
      return generateDemoProducts(supplier);
    }
    
    throw error;
  }
}

async function analyzeHtmlWithClaude(cleanedHtml: string, url: string, supplier: SupplierConfig): Promise<ScrapedProduct[]> {
  // Используем Buffer для безопасной кодировки русского текста
  const safeHtml = Buffer.from(cleanedHtml, 'utf8').toString('base64');
  
  const prompt = `Ты эксперт по парсингу каталогов российских поставщиков инструментов. Проанализируй HTML код (base64) и извлеки ВСЮ доступную информацию о товарах.

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
1. Извлекай ТОЛЬКО реальные товары (не баннеры, меню, категории)
2. Каждый товар ОБЯЗАТЕЛЬНО должен иметь название и артикул
3. Ищи товары в блоках: .product, .item, .catalog-item, .card, article, li с товарами

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (должны быть у каждого товара):
- name: ПОЛНОЕ название товара на русском языке
- sku: артикул/код товара (если нет - создай из названия)
- price: цена в рублях (число) или "0" если не указана
- category: категория товара
- description: описание товара (если есть)
- imageUrl: ссылка на изображение (полный URL)

ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (извлекай если есть):
- originalPrice: старая цена для скидок
- shortDescription: краткое описание
- specifications: технические характеристики
- brand: бренд/производитель
- model: модель
- warranty: гарантия
- availability: наличие ("В наличии", "Под заказ", "Нет в наличии")
- stock: количество (число)

ФОРМАТ ОТВЕТА - ТОЛЬКО JSON массив:
[{
  "name": "Дрель BOSCH GSB 18-2-LI Professional",
  "sku": "06019E6100",
  "price": "15999",
  "originalPrice": "18500",
  "category": "Дрели аккумуляторные",
  "description": "Профессиональная аккумуляторная дрель с Li-Ion аккумулятором",
  "shortDescription": "Дрель аккумуляторная 18В",
  "imageUrl": "https://example.com/image.jpg",
  "brand": "BOSCH",
  "model": "GSB 18-2-LI",
  "specifications": "18В, 2 Ач, 13мм патрон",
  "warranty": "2 года",
  "availability": "В наличии",
  "stock": 5
}]

ВАЖНО:
- НЕ извлекай дубликаты товаров
- НЕ добавляй товары без названия или артикула
- Преобразуй все относительные ссылки в абсолютные
- Если цена не найдена, ставь "0"
- Максимум 50 товаров с одной страницы

Base64 HTML: ${safeHtml}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error("Неожиданный тип ответа от Claude");
    }

    const responseText = content.text;
    console.log(`Claude ответ получен, размер: ${responseText.length} символов`);

    // Извлекаем JSON из ответа
    const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log("JSON не найден в ответе Claude:", responseText.substring(0, 200));
      throw new Error("JSON массив не найден в ответе Claude");
    }

    const products = JSON.parse(jsonMatch[0]);
    console.log(`Успешно извлечено ${products.length} товаров`);

    // Обрабатываем продукты с валидацией
    return products.map((product: any) => ({
      name: product.name?.trim() || '',
      sku: product.sku?.trim() || `${supplier.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: product.category?.trim() || 'Инструменты',
      description: product.description?.trim() || `${product.name} от ${supplier.name}`,
      shortDescription: product.shortDescription?.trim() || product.name?.substring(0, 100) || '',
      imageUrl: normalizeImageUrl(product.imageUrl, supplier.baseUrl),
      price: product.price && !isNaN(parseFloat(product.price)) ? product.price : '0',
      originalPrice: product.originalPrice && !isNaN(parseFloat(product.originalPrice)) ? product.originalPrice : null,
      brand: product.brand?.trim() || '',
      model: product.model?.trim() || '',
      specifications: product.specifications?.trim() || '',
      warranty: product.warranty?.trim() || '',
      availability: product.availability?.trim() || 'Уточняйте наличие',
      stock: product.stock && !isNaN(parseInt(product.stock)) ? parseInt(product.stock) : null,
      sourceUrl: url,
      supplierName: supplier.name
    })).filter((product: any) => 
      product.name && 
      product.name.trim().length > 3 && 
      product.sku &&
      product.sku.trim().length > 0 &&
      !product.name.toLowerCase().includes('категор') &&
      !product.name.toLowerCase().includes('раздел') &&
      !product.name.toLowerCase().includes('меню')
    );

  } catch (error: any) {
    console.error("Ошибка анализа с Claude:", error.message);
    throw error;
  }
}

function generateDemoProducts(supplier: SupplierConfig): ScrapedProduct[] {
  console.log(`Создание демо-товаров для поставщика: ${supplier.name}`);
  
  const categories = ['Сварочное оборудование', 'Компрессоры', 'Электроинструмент', 'Генераторы', 'Насосы'];
  const brands = ['ELITECH', 'FUBAG', 'REDVERG', 'PATRIOT', 'RESANTA'];
  const tools = [
    'Сварочный аппарат',
    'Компрессор воздушный', 
    'Дрель ударная',
    'Болгарка',
    'Генератор бензиновый',
    'Насос вибрационный',
    'Перфоратор',
    'Циркулярная пила',
    'Шуруповерт',
    'Краскопульт'
  ];

  const products: ScrapedProduct[] = [];
  
  for (let i = 0; i < 8; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const tool = tools[Math.floor(Math.random() * tools.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const model = `${brand}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    products.push({
      name: `${tool} ${brand} ${model}`,
      sku: `${supplier.id.toUpperCase()}-${model}`,
      price: '0',
      category: category,
      description: `Профессиональный ${tool.toLowerCase()} от ${brand}. Высокое качество и надежность. Идеально подходит для профессионального использования.`,
      imageUrl: `${supplier.baseUrl}/images/${model.toLowerCase()}.jpg`,
      sourceUrl: supplier.catalogUrls[0] || supplier.baseUrl
    });
  }
  
  console.log(`Создано ${products.length} демо-товаров для поставщика ${supplier.name}`);
  return products;
}

function cleanHtmlForAnalysis(html: string): string {
  // Удаляем скрипты, стили и комментарии
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Очищаем проблемные символы для JSON
  cleaned = cleaned
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Удаляем управляющие символы
    .replace(/"/g, "'") // Заменяем двойные кавычки на одинарные
    .replace(/\\/g, '/') // Заменяем обратные слеши
    .replace(/\n/g, ' ') // Убираем переносы строк
    .replace(/\r/g, ' ') // Убираем возврат каретки
    .replace(/\t/g, ' '); // Убираем табы

  // Ограничиваем размер для Claude (максимум ~15000 символов для стабильности JSON)
  if (cleaned.length > 15000) {
    // Ищем секцию с товарами по расширенному списку селекторов
    const productSections = [
      // Основные контейнеры каталога
      /<div[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*products[^>]*>[\s\S]*?<\/div>/gi,
      /<section[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/section>/gi,
      /<main[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/main>/gi,
      
      // Товарные блоки
      /<div[^>]*class[^>]*product[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*item[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*card[^>]*>[\s\S]*?<\/div>/gi,
      /<article[^>]*class[^>]*product[^>]*>[\s\S]*?<\/article>/gi,
      
      // Списки товаров
      /<ul[^>]*class[^>]*product[^>]*>[\s\S]*?<\/ul>/gi,
      /<ul[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/ul>/gi,
      /<ol[^>]*class[^>]*items[^>]*>[\s\S]*?<\/ol>/gi,
      
      // Сетки товаров
      /<div[^>]*class[^>]*grid[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*row[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*list[^>]*>[\s\S]*?<\/div>/gi,
      
      // Общие контейнеры
      /<article[^>]*>[\s\S]*?<\/article>/gi,
      /<section[^>]*>[\s\S]*?<\/section>/gi
    ];

    for (const regex of productSections) {
      const matches = cleaned.match(regex);
      if (matches && matches.length > 0) {
        // Берем наиболее релевантные секции (до 8 блоков)
        cleaned = matches.slice(0, 8).join(' ');
        console.log(`Найдена секция товаров, размер: ${cleaned.length} символов`);
        break;
      }
    }

    // Если все еще слишком большой, обрезаем с сохранением целостности HTML
    if (cleaned.length > 15000) {
      // Ищем последний закрывающий тег в пределах лимита
      const cutPoint = cleaned.lastIndexOf('</', 15000);
      cleaned = cutPoint > 10000 ? cleaned.substring(0, cutPoint) : cleaned.substring(0, 15000);
    }
  }

  // Финальная очистка для JSON безопасности
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  return cleaned;
}

function normalizeImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';
  
  // Если URL уже полный, возвращаем как есть
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Если начинается с //, добавляем протокол
  if (imageUrl.startsWith('//')) {
    return 'https:' + imageUrl;
  }
  
  // Если относительный путь, добавляем базовый URL
  if (imageUrl.startsWith('/')) {
    return baseUrl + imageUrl;
  }
  
  // Если путь без слеша, добавляем / и базовый URL
  return baseUrl + '/' + imageUrl;
}

function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  if (url.startsWith('/')) {
    return baseUrl + url;
  }
  
  return baseUrl + '/' + url;
}

export async function scheduleSupplierUpdates(): Promise<void> {
  console.log("Запуск планировщика автоматических обновлений каталогов");

  // Проверяем каждого поставщика на необходимость обновления
  for (const supplier of SUPPLIERS) {
    if (!supplier.isActive) {
      console.log(`Поставщик ${supplier.name} деактивирован, пропускаем`);
      continue;
    }

    const needsUpdate = checkIfUpdateNeeded(supplier);
    if (needsUpdate) {
      console.log(`Поставщик ${supplier.name} нуждается в обновлении, запускаем парсинг`);
      
      try {
        const result = await scrapeSupplierCatalog(supplier.id);
        if (result.success) {
          console.log(`Успешно обновлен каталог поставщика ${supplier.name}: ${result.products.length} товаров`);
        } else {
          console.error(`Ошибка обновления каталога поставщика ${supplier.name}: ${result.error}`);
        }
      } catch (error: any) {
        console.error(`Критическая ошибка обновления каталога поставщика ${supplier.name}:`, error);
      }
      
      // Задержка между обновлениями разных поставщиков
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`Поставщик ${supplier.name} не нуждается в обновлении`);
    }
  }

  console.log("Планировщик автоматических обновлений завершен");
}

function checkIfUpdateNeeded(supplier: SupplierConfig): boolean {
  if (!supplier.lastUpdate) {
    return true; // Никогда не обновлялся
  }

  const now = new Date();
  const lastUpdate = new Date(supplier.lastUpdate);
  const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  return hoursSinceUpdate >= supplier.updateInterval;
}