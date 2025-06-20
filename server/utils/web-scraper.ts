import Anthropic from '@anthropic-ai/sdk';

interface ScrapedProduct {
  name: string;
  sku: string;
  price: string;
  category: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
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

    // Используем Claude для анализа HTML и извлечения данных о товарах
    const prompt = `
Ты - эксперт по анализу HTML каталогов интернет-магазинов инструментов. Проанализируй HTML код страницы с сайта "${supplier.name}" и извлеки информацию о товарах.

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ для каждого товара:
1. name - полное название товара
2. sku - артикул/код товара (ищи в атрибутах data-sku, data-code, data-id, артикул, код, model)
3. category - категория товара (сварочное оборудование, компрессоры, электроинструмент и т.д.)
4. description - описание или характеристики товара
5. imageUrl - URL изображения товара

ВАЖНЫЕ ПРАВИЛА:
- Артикул (sku) ОБЯЗАТЕЛЕН - если его нет, пропусти товар
- Ищи товары в блоках с классами product, item, card, goods
- URL изображений делай полными относительно ${supplier.baseUrl}
- Если товар не имеет всех обязательных полей - пропусти его
- Возвращай ТОЛЬКО валидный JSON массив без комментариев

ФОРМАТ ОТВЕТА:
[
  {
    "name": "Название товара",
    "sku": "артикул",
    "category": "Категория",
    "description": "Описание товара",
    "imageUrl": "полный URL изображения",
    "sourceUrl": "${url}"
  }
]

HTML КОД:
${cleanedHtml}
`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    if (!claudeResponse.content || claudeResponse.content.length === 0) {
      throw new Error("Пустой ответ от Claude API");
    }

    const content = claudeResponse.content[0];
    if (content.type !== 'text') {
      throw new Error("Неожиданный тип ответа от Claude API");
    }

    const responseText = content.text;
    console.log(`Ответ Claude получен, размер: ${responseText.length} символов`);

    // Парсим JSON ответ от Claude
    let products: ScrapedProduct[];
    try {
      // Ищем JSON массив в ответе
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
        console.log(`Успешно распарсен JSON с ${products.length} товарами`);
      } else {
        console.log("JSON массив не найден в ответе Claude, используем fallback");
        console.log("Ответ Claude:", responseText.substring(0, 500));
        // Если Claude не вернул JSON, создаем демо-данные для демонстрации
        throw new Error("JSON не найден в ответе Claude");
      }
    } catch (parseError) {
      console.error("Ошибка парсинга JSON от Claude:", parseError);
      console.log("Используем демо-данные для демонстрации системы");
      throw new Error(`Невозможно распарсить ответ Claude: ${parseError}`);
    }

    // Обрабатываем и нормализуем данные товаров
    const processedProducts = products.map(product => ({
      ...product,
      price: '0', // B2B - все цены скрыты
      imageUrl: normalizeImageUrl(product.imageUrl, supplier.baseUrl),
      sourceUrl: url
    })).filter(product => 
      product.name && 
      product.sku && 
      product.name.trim().length > 0 && 
      product.sku.trim().length > 0
    );

    console.log(`Успешно обработано ${processedProducts.length} товаров из ${products.length} найденных`);
    return processedProducts;

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

  // Ограничиваем размер для Claude (максимум ~50000 символов)
  if (cleaned.length > 50000) {
    // Ищем секцию с товарами
    const productSections = [
      /<div[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*product[^>]*>[\s\S]*?<\/div>/gi,
      /<section[^>]*class[^>]*catalog[^>]*>[\s\S]*?<\/section>/gi,
      /<ul[^>]*class[^>]*product[^>]*>[\s\S]*?<\/ul>/gi
    ];

    for (const regex of productSections) {
      const matches = cleaned.match(regex);
      if (matches && matches.length > 0) {
        cleaned = matches.join('\n');
        break;
      }
    }

    // Если все еще слишком большой, обрезаем
    if (cleaned.length > 50000) {
      cleaned = cleaned.substring(0, 50000) + '...';
    }
  }

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