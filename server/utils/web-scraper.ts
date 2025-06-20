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
    id: 'staniks',
    name: 'СТАНИКС',
    baseUrl: 'https://stanix.ru',
    catalogUrls: [
      'https://stanix.ru/catalog/svarochnoe-oborudovanie/',
      'https://stanix.ru/catalog/kompressory/',
      'https://stanix.ru/catalog/elektro-instrument/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'prosvar',
    name: 'ПРОСВАР',
    baseUrl: 'https://prosvar.ru',
    catalogUrls: [
      'https://prosvar.ru/catalog/svarochnyye-apparaty/',
      'https://prosvar.ru/catalog/kompressory/',
      'https://prosvar.ru/catalog/generatory/'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'senix',
    name: 'SENIX',
    baseUrl: 'https://senix.ru',
    catalogUrls: [
      'https://senix.ru/catalog/svarochnoye-oborudovaniye/',
      'https://senix.ru/catalog/kompressory-vozdukhnyye/',
      'https://senix.ru/catalog/generatory-benzinovyye/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'bojet',
    name: 'BOJET',
    baseUrl: 'https://bojet.ru',
    catalogUrls: [
      'https://bojet.ru/catalog/svarochnoe-oborudovanie/',
      'https://bojet.ru/catalog/kompressory/',
      'https://bojet.ru/catalog/elektro-benzinovyy-instrument/'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'dck',
    name: 'DCK',
    baseUrl: 'https://dck-tools.ru',
    catalogUrls: [
      'https://dck-tools.ru/catalog/svarochnoye-oborudovaniye/',
      'https://dck-tools.ru/catalog/kompressornoye-oborudovaniye/',
      'https://dck-tools.ru/catalog/elektroinstument/'
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
    console.log(`Получение HTML страницы: ${url}`);
    
    // Получаем HTML страницы
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ошибка: ${response.status} для ${url}`);
    }

    const html = await response.text();
    const cleanedHtml = cleanHtmlForAnalysis(html);

    console.log(`HTML получен, размер: ${cleanedHtml.length} символов`);

    // Используем Claude для анализа HTML и извлечения данных о товарах
    const prompt = `
Проанализируй HTML код каталога товаров с сайта "${supplier.name}" и извлеки информацию о товарах.

Мне нужно получить 5 обязательных полей для каждого товара:
1. name - название товара
2. sku - артикул/код товара (может быть в атрибутах data-sku, артикул, код, model и т.п.)
3. category - категория товара
4. description - описание или характеристики товара
5. imageUrl - URL изображения товара

Верни результат в формате JSON массива объектов:
[
  {
    "name": "название товара",
    "sku": "артикул товара",
    "category": "категория",
    "description": "описание товара",
    "imageUrl": "полный URL изображения",
    "sourceUrl": "${url}"
  }
]

HTML код страницы:
${cleanedHtml}

ВАЖНО: 
- Артикул (sku) обязательно должен быть найден - ищи в атрибутах data-sku, data-id, артикул, код, model
- URL изображений преобразуй в полные URL относительно базового домена ${supplier.baseUrl}
- Если товар не имеет артикула - пропусти его
- Верни только валидный JSON без дополнительных комментариев
`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = claudeResponse.content[0].text;
    console.log(`Ответ Claude получен, размер: ${responseText.length} символов`);

    // Парсим JSON ответ от Claude
    let products: ScrapedProduct[];
    try {
      // Ищем JSON в ответе Claude
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON не найден в ответе Claude");
      }
    } catch (parseError) {
      console.error("Ошибка парсинга JSON от Claude:", parseError);
      console.error("Ответ Claude:", responseText);
      throw new Error("Невозможно распарсить ответ Claude");
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

    console.log(`Обработано ${processedProducts.length} товаров из ${products.length} найденных`);
    return processedProducts;

  } catch (error: any) {
    console.error(`Ошибка парсинга страницы ${url}:`, error);
    throw new Error(`Ошибка парсинга страницы: ${error.message}`);
  }
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