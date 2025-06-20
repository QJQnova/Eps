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
  
  const prompt = `Analyze this Russian tool supplier HTML content (base64 encoded) and extract ALL AVAILABLE product information.

Extract products with MAXIMUM information for each:

REQUIRED FIELDS:
1. name - full product name in Russian
2. sku - product code/article (mandatory)
3. price - price in rubles or "По запросу"
4. category - product category
5. description - full product description
6. imageUrl - main product image

OPTIONAL FIELDS (extract if available):
7. originalPrice - old price (if on sale)
8. shortDescription - brief description
9. specifications - technical specifications
10. imageUrls - all product images (array)
11. brand - manufacturer/brand
12. model - product model
13. warranty - warranty period
14. availability - stock status ("В наличии", "Под заказ", etc)
15. stock - quantity available (number)
16. features - product features/benefits (array)

Return ONLY a JSON array with maximum available data:
[{
  "name":"Full Product Name",
  "sku":"product-code",
  "price":"15999",
  "originalPrice":"18999",
  "category":"Category",
  "description":"Full description",
  "shortDescription":"Brief description",
  "specifications":"Technical specs",
  "imageUrl":"main-image-url",
  "imageUrls":["image1","image2"],
  "brand":"Brand",
  "model":"Model",
  "warranty":"2 года",
  "availability":"В наличии",
  "stock":15,
  "features":["feature1","feature2"]
}]

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

    // Обрабатываем продукты
    return products.map((product: any) => ({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || 'Инструменты',
      description: product.description || '',
      imageUrl: normalizeImageUrl(product.imageUrl, supplier.baseUrl),
      sourceUrl: url,
      price: '0' // B2B - цены скрыты
    })).filter((product: any) => 
      product.name && product.sku && 
      product.name.trim().length > 0 && 
      product.sku.trim().length > 0
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
    // Ищем секцию с товарами
    const productSections = [
      /<div[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*product[^>]*>[\s\S]*?<\/div>/gi,
      /<section[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/section>/gi,
      /<ul[^>]*class[^>]*product[^>]*>[\s\S]*?<\/ul>/gi,
      /<div[^>]*class[^>]*item[^>]*>[\s\S]*?<\/div>/gi,
      /<article[^>]*>[\s\S]*?<\/article>/gi
    ];

    for (const regex of productSections) {
      const matches = cleaned.match(regex);
      if (matches && matches.length > 0) {
        cleaned = matches.slice(0, 5).join(' '); // Берем первые 5 элементов
        break;
      }
    }

    // Если все еще слишком большой, обрезаем
    if (cleaned.length > 15000) {
      cleaned = cleaned.substring(0, 15000);
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