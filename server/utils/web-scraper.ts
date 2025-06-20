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
    id: 'bojet',
    name: 'BOJET',
    baseUrl: 'https://bojet.ru',
    catalogUrls: [
      '/attached_assets/BOJET Прайс-лист 29.04.25_1750360039697.xlsx'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'dck',
    name: 'DCK',
    baseUrl: 'https://dck-tools.ru',
    catalogUrls: [
      '/attached_assets/DCK продуктовые карточки 26.07.2024_1750416519204.xlsx'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'senix',
    name: 'SENIX',
    baseUrl: 'https://senix.ru',
    catalogUrls: [
      '/attached_assets/SENIX Прайс-лист 06.05.25_1750356117297.xlsx'
    ],
    updateInterval: 12,
    isActive: true
  },
  {
    id: 'prosvar',
    name: 'ПРОСВАР',
    baseUrl: 'https://prosvar.ru',
    catalogUrls: [
      '/attached_assets/ПРОСВАР_1749380864051.xml'
    ],
    updateInterval: 24,
    isActive: true
  },
  {
    id: 'staniks',
    name: 'СТАНИКС',
    baseUrl: 'https://stanix.ru',
    catalogUrls: [
      '/attached_assets/СТАНИКС_1749380096828.xml'
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

async function scrapePageWithClaude(filePath: string, supplier: SupplierConfig): Promise<ScrapedProduct[]> {
  try {
    console.log(`Обработка файла каталога: ${filePath}`);
    
    // Импортируем file-parser для работы с файлами
    const { parseFile } = await import('./file-parser');
    
    // Определяем полный путь к файлу
    const fullPath = `.${filePath}`;
    
    // Парсим файл в зависимости от его типа
    let parsedData;
    try {
      parsedData = await parseFile(fullPath);
    } catch (parseError: any) {
      console.error(`Ошибка парсинга файла ${fullPath}:`, parseError);
      throw new Error(`Не удалось распарсить файл: ${parseError.message}`);
    }

    console.log(`Файл распарсен, найдено записей: ${parsedData.length}`);

    if (parsedData.length === 0) {
      console.log(`Файл ${filePath} не содержит данных`);
      return [];
    }

    // Конвертируем распарсенные данные в формат ScrapedProduct
    const products: ScrapedProduct[] = parsedData.map((item: any) => {
      // Извлекаем необходимые поля из разных форматов
      const name = item.name || item['Наименование'] || item['название'] || item['товар'] || '';
      const sku = item.sku || item.code || item.artikel || item['Артикул'] || item['код'] || item['SKU'] || '';
      const category = item.category || item['Категория'] || item['группа'] || item['раздел'] || 'Инструменты';
      const description = item.description || item['Описание'] || item['характеристики'] || item['комментарий'] || 
                         `Профессиональный инструмент ${name}`;
      
      // Для изображений используем заглушку с логикой поиска реальных изображений
      const imageUrl = item.imageUrl || item['изображение'] || `${supplier.baseUrl}/images/products/${sku}.jpg`;

      return {
        name: String(name).trim(),
        sku: String(sku).trim(),
        price: '0', // B2B - все цены скрыты
        category: String(category).trim(),
        description: String(description).trim(),
        imageUrl: normalizeImageUrl(imageUrl, supplier.baseUrl),
        sourceUrl: filePath
      };
    }).filter(product => 
      product.name && 
      product.sku && 
      product.name.length > 0 && 
      product.sku.length > 0
    );

    console.log(`Обработано ${products.length} товаров из ${parsedData.length} записей файла`);
    return products;

  } catch (error: any) {
    console.error(`Ошибка обработки файла ${filePath}:`, error);
    throw new Error(`Ошибка обработки файла: ${error.message}`);
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