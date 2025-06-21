import { storage } from '../storage';
import { InsertProduct } from '../../shared/schema';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ScrapedProduct {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  imageUrl?: string;
  sku: string;
  characteristics?: string;
}

interface ImportResult {
  success: boolean;
  productsImported: number;
  failed: number;
  total: number;
  error?: string;
}

export async function scrapePittoolsCatalog(): Promise<ImportResult> {
  console.log('Начинаю полный импорт каталога pittools.ru');
  
  try {
    // Получаем главную страницу каталога
    const catalogHtml = await fetchPage('https://pittools.ru/catalog/');
    if (!catalogHtml) {
      throw new Error('Не удалось загрузить каталог pittools.ru');
    }

    // Извлекаем все категории
    const categories = await extractCategories(catalogHtml);
    console.log(`Найдено категорий: ${categories.length}`);

    let allProducts: ScrapedProduct[] = [];
    
    // Обрабатываем каждую категорию
    for (const category of categories.slice(0, 20)) { // Ограничиваем 20 категориями
      console.log(`Обрабатываю категорию: ${category.name}`);
      
      try {
        const categoryProducts = await scrapeCategoryProducts(category.url);
        allProducts = [...allProducts, ...categoryProducts];
        console.log(`Найдено товаров в категории "${category.name}": ${categoryProducts.length}`);
        
        // Пауза между категориями
        await delay(2000);
      } catch (error) {
        console.error(`Ошибка обработки категории ${category.name}:`, error);
      }
    }

    console.log(`Всего найдено товаров: ${allProducts.length}`);

    if (allProducts.length === 0) {
      return {
        success: false,
        productsImported: 0,
        failed: 0,
        total: 0,
        error: 'Товары не найдены'
      };
    }

    // Импортируем товары в базу данных
    const importResult = await importProductsToDatabase(allProducts);
    
    return {
      success: true,
      productsImported: importResult.success,
      failed: importResult.failed,
      total: allProducts.length
    };

  } catch (error: any) {
    console.error('Ошибка импорта каталога pittools.ru:', error);
    return {
      success: false,
      productsImported: 0,
      failed: 0,
      total: 0,
      error: error.message
    };
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    console.log(`Загружаю страницу: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status} для ${url}`);
      return null;
    }

    const html = await response.text();
    console.log(`Загружена страница: ${url} (${html.length} символов)`);
    return html;

  } catch (error) {
    console.error(`Ошибка загрузки ${url}:`, error);
    return null;
  }
}

async function extractCategories(html: string): Promise<Array<{name: string, url: string}>> {
  try {
    const prompt = `
Анализируй HTML код каталога сайта pittools.ru и извлеки все категории товаров.

Найди все ссылки на категории товаров и верни их в JSON формате:
[
  {"name": "Название категории", "url": "https://pittools.ru/catalog/category-url/"},
  ...
]

Ищи ссылки в навигации, меню каталога, списках категорий.
Исключи служебные ссылки (контакты, доставка и т.д.).
Включи только категории товаров.

HTML:
${html.substring(0, 50000)}
`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Ответ Claude для категорий:', responseText.substring(0, 500));
    
    // Ищем JSON в ответе
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('JSON не найден в ответе Claude');
      return [];
    }

    const categories = JSON.parse(jsonMatch[0]);
    console.log(`Извлечено категорий: ${categories.length}`);
    
    return categories.map((cat: any) => ({
      name: cat.name,
      url: cat.url.startsWith('http') ? cat.url : `https://pittools.ru${cat.url}`
    }));

  } catch (error) {
    console.error('Ошибка извлечения категорий:', error);
    return [];
  }
}

async function scrapeCategoryProducts(categoryUrl: string): Promise<ScrapedProduct[]> {
  try {
    const html = await fetchPage(categoryUrl);
    if (!html) return [];

    // Пробуем извлечь товары со страницы категории
    const products = await extractProductsFromPage(html, categoryUrl);
    
    // Если найдено мало товаров, пробуем найти пагинацию
    if (products.length < 20) {
      const additionalProducts = await scrapePaginatedCategory(categoryUrl, html);
      return [...products, ...additionalProducts];
    }
    
    return products;

  } catch (error) {
    console.error(`Ошибка скрапинга категории ${categoryUrl}:`, error);
    return [];
  }
}

async function extractProductsFromPage(html: string, sourceUrl: string): Promise<ScrapedProduct[]> {
  try {
    const prompt = `
Анализируй HTML страницу каталога товаров с сайта pittools.ru и извлеки все товары.

Для каждого товара найди:
- Название товара
- Цену (в рублях, только числа)
- Старую цену если есть скидка
- Описание или краткое описание
- Ссылку на изображение
- Артикул/SKU если есть

Верни товары в JSON формате:
[
  {
    "name": "Название товара",
    "price": "2500",
    "originalPrice": "3000",
    "description": "Описание товара",
    "imageUrl": "https://pittools.ru/image.jpg",
    "sku": "PIT-001"
  },
  ...
]

Источник: ${sourceUrl}

HTML:
${html.substring(0, 40000)}
`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Ответ Claude для товаров:', responseText.substring(0, 300));
    
    // Ищем JSON в ответе
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('JSON товаров не найден в ответе Claude');
      return [];
    }

    const products = JSON.parse(jsonMatch[0]);
    console.log(`Извлечено товаров со страницы: ${products.length}`);
    
    return products.map((product: any) => ({
      name: product.name || 'Товар без названия',
      price: product.price?.toString() || '0',
      originalPrice: product.originalPrice?.toString() || null,
      description: product.description || `Товар ${product.name} от P.I.T Tools`,
      imageUrl: product.imageUrl?.startsWith('http') ? product.imageUrl : 
                (product.imageUrl ? `https://pittools.ru${product.imageUrl}` : null),
      sku: product.sku || `PIT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      characteristics: product.characteristics || null
    }));

  } catch (error) {
    console.error('Ошибка извлечения товаров:', error);
    return [];
  }
}

async function scrapePaginatedCategory(categoryUrl: string, firstPageHtml: string): Promise<ScrapedProduct[]> {
  // Ищем ссылки на следующие страницы
  const pageLinks = extractPaginationLinks(firstPageHtml, categoryUrl);
  const allProducts: ScrapedProduct[] = [];

  for (const pageUrl of pageLinks.slice(0, 5)) { // Ограничиваем 5 страницами
    try {
      const pageHtml = await fetchPage(pageUrl);
      if (pageHtml) {
        const pageProducts = await extractProductsFromPage(pageHtml, pageUrl);
        allProducts.push(...pageProducts);
        await delay(1500);
      }
    } catch (error) {
      console.error(`Ошибка обработки страницы ${pageUrl}:`, error);
    }
  }

  return allProducts;
}

function extractPaginationLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  
  // Ищем ссылки пагинации
  const paginationRegex = /href="([^"]*(?:page|p)=\d+[^"]*)"/gi;
  let match;
  
  while ((match = paginationRegex.exec(html)) !== null) {
    const link = match[1];
    const fullUrl = link.startsWith('http') ? link : `https://pittools.ru${link}`;
    if (!links.includes(fullUrl)) {
      links.push(fullUrl);
    }
  }

  return links;
}

async function importProductsToDatabase(scrapedProducts: ScrapedProduct[]): Promise<{success: number, failed: number}> {
  console.log(`Импортирую ${scrapedProducts.length} товаров в базу данных`);
  
  const categories = await storage.getAllCategories();
  const products: InsertProduct[] = [];

  for (const scrapedProduct of scrapedProducts) {
    try {
      // Определяем категорию для товара
      const category = findBestCategory(scrapedProduct.name, scrapedProduct.description, categories);
      
      const product: InsertProduct = {
        sku: scrapedProduct.sku,
        name: scrapedProduct.name,
        slug: generateSlug(scrapedProduct.name),
        description: scrapedProduct.description,
        shortDescription: scrapedProduct.name.length > 100 ? 
          scrapedProduct.name.substring(0, 97) + '...' : scrapedProduct.name,
        price: scrapedProduct.price,
        originalPrice: scrapedProduct.originalPrice,
        categoryId: category.id,
        imageUrl: scrapedProduct.imageUrl,
        stock: Math.floor(Math.random() * 50) + 5,
        isActive: true,
        isFeatured: Math.random() > 0.9,
        tag: 'P.I.T Tools'
      };

      products.push(product);
    } catch (error) {
      console.error('Ошибка создания товара:', error);
    }
  }

  console.log(`Подготовлено для импорта: ${products.length} товаров`);

  // Импортируем пакетами
  const batchSize = 50;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`Импортирую пакет ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}`);
    
    try {
      const result = await storage.bulkImportProducts(batch);
      totalSuccess += result.success;
      totalFailed += result.failed;
    } catch (error) {
      console.error('Ошибка импорта пакета:', error);
      totalFailed += batch.length;
    }
  }

  return { success: totalSuccess, failed: totalFailed };
}

function findBestCategory(productName: string, description: string, categories: any[]) {
  const text = `${productName} ${description}`.toLowerCase();
  
  // Ищем наиболее подходящую категорию
  for (const category of categories) {
    const categoryName = category.name.toLowerCase();
    
    if (text.includes('дрель') || text.includes('перфоратор') || text.includes('шуруповерт')) {
      if (categoryName.includes('инструмент') || categoryName.includes('электро')) {
        return category;
      }
    }
    
    if (text.includes('компрессор')) {
      if (categoryName.includes('компрессор')) {
        return category;
      }
    }
    
    if (text.includes('генератор')) {
      if (categoryName.includes('генератор') || categoryName.includes('электро')) {
        return category;
      }
    }
    
    if (text.includes('насос')) {
      if (categoryName.includes('насос')) {
        return category;
      }
    }
    
    if (text.includes('измерит') || text.includes('метр') || text.includes('уровень')) {
      if (categoryName.includes('измерит')) {
        return category;
      }
    }
  }
  
  // По умолчанию возвращаем первую категорию
  return categories[0];
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}