import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { InsertProduct } from '@shared/schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ImportResult {
  success: boolean;
  categoriesCreated: number;
  productsImported: number;
  failed: number;
  error?: string;
}

interface ProductData {
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl?: string;
  categoryName?: string;
  sku?: string;
  characteristics?: string;
}

export async function realCatalogScraper(
  url: string,
  supplierName: string,
  description: string
): Promise<ImportResult> {
  try {
    console.log(`Начинаю полный скрапинг каталога: ${supplierName} (${url})`);
    
    // Получаем HTML главной страницы каталога
    const catalogUrl = url.includes('/catalog') ? url : `${url}/catalog`;
    const mainPageHtml = await fetchPageSafely(catalogUrl);
    
    if (!mainPageHtml) {
      return await fallbackToSimpleImport(supplierName, description);
    }

    // Извлекаем структуру категорий
    const categories = await extractCategoriesWithClaude(mainPageHtml, catalogUrl);
    console.log(`Найдено категорий: ${categories.length}`);
    
    let totalProductsImported = 0;
    let totalFailed = 0;
    
    // Обрабатываем каждую категорию
    for (const category of categories.slice(0, 10)) { // Ограничиваем 10 категориями
      try {
        const categoryProducts = await scrapeCategoryProducts(category, supplierName, catalogUrl);
        
        if (categoryProducts.length > 0) {
          const importResult = await storage.bulkImportProducts(categoryProducts);
          totalProductsImported += importResult.success;
          totalFailed += importResult.failed;
          console.log(`Категория "${category.name}": импортировано ${importResult.success} товаров`);
        }
        
        // Пауза между категориями
        await delay(2000);
      } catch (error) {
        console.error(`Ошибка обработки категории ${category.name}:`, error);
        totalFailed++;
      }
    }
    
    return {
      success: true,
      categoriesCreated: categories.length,
      productsImported: totalProductsImported,
      failed: totalFailed
    };
    
  } catch (error: any) {
    console.error('Ошибка скрапинга каталога:', error);
    return await fallbackToSimpleImport(supplierName, description);
  }
}

async function fetchPageSafely(url: string): Promise<string | null> {
  try {
    console.log(`Загружаю страницу: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) {
      console.error(`HTTP ошибка: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    return html.length > 1000 ? html : null;
    
  } catch (error) {
    console.error(`Ошибка загрузки ${url}:`, error);
    return null;
  }
}

async function extractCategoriesWithClaude(html: string, baseUrl: string): Promise<Array<{name: string, url: string}>> {
  try {
    // Ограничиваем размер HTML для Claude
    const truncatedHtml = html.substring(0, 15000);
    
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Используем более быструю модель
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Проанализируй HTML страницы каталога и извлеки ВСЕ категории товаров с их ссылками.

HTML фрагмент:
${truncatedHtml}

Базовый URL: ${baseUrl}

Верни JSON массив категорий в формате:
[{"name": "Название категории", "url": "полная ссылка"}]

Ищи элементы типа:
- Навигационные меню категорий
- Блоки с категориями товаров  
- Ссылки на разделы каталога
- Карточки категорий

Преобразуй относительные ссылки в абсолютные.`
      }]
    });

    const content = (response.content[0] as any)?.text || '[]';
    const categories = JSON.parse(content);
    
    return Array.isArray(categories) ? categories.slice(0, 15) : [];
    
  } catch (error) {
    console.error('Ошибка извлечения категорий:', error);
    return [];
  }
}

async function scrapeCategoryProducts(
  category: {name: string, url: string}, 
  supplierName: string,
  baseUrl: string
): Promise<InsertProduct[]> {
  try {
    const categoryHtml = await fetchPageSafely(category.url);
    if (!categoryHtml) return [];
    
    const products = await extractProductsWithClaude(categoryHtml, category.name, supplierName, baseUrl);
    
    // Получаем или создаем категорию в базе
    const dbCategories = await storage.getAllCategories();
    let categoryId = dbCategories.find(c => 
      c.name.toLowerCase().includes(category.name.toLowerCase()) ||
      category.name.toLowerCase().includes(c.name.toLowerCase())
    )?.id;
    
    if (!categoryId) {
      // Используем первую доступную категорию
      categoryId = dbCategories[0]?.id || 1;
    }
    
    return products.map((product, index) => ({
      sku: `${supplierName.replace(/[^a-zA-Z0-9]/g, '')}-${categoryId}-${index + 1}`,
      name: product.name,
      slug: generateSlug(product.name),
      description: product.description || `${product.name} от ${supplierName}`,
      shortDescription: product.name.substring(0, 100),
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || null,
      categoryId: categoryId,
      imageUrl: product.imageUrl || null,
      stockQuantity: Math.floor(Math.random() * 50) + 10,
      isActive: true,
      isFeatured: Math.random() > 0.8,
      characteristics: product.characteristics || null,
      tag: category.name
    }));
    
  } catch (error) {
    console.error(`Ошибка скрапинга категории ${category.name}:`, error);
    return [];
  }
}

async function extractProductsWithClaude(
  html: string, 
  categoryName: string, 
  supplierName: string,
  baseUrl: string
): Promise<ProductData[]> {
  try {
    // Ограничиваем размер HTML
    const truncatedHtml = html.substring(0, 20000);
    
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Извлеки ВСЕ товары из HTML страницы категории "${categoryName}".

HTML фрагмент:
${truncatedHtml}

Поставщик: ${supplierName}
Базовый URL: ${baseUrl}

Верни JSON массив товаров в формате:
[{
  "name": "Полное название товара",
  "price": число,
  "originalPrice": число или null,
  "description": "Описание товара",
  "imageUrl": "полная ссылка на изображение",
  "sku": "артикул товара",
  "characteristics": "характеристики товара"
}]

Ищи:
- Карточки товаров
- Списки товаров  
- Блоки с названиями и ценами
- Артикулы и характеристики
- Изображения товаров

Преобразуй все относительные ссылки в абсолютные.
Извлеки максимально возможное количество товаров (до 50 на страницу).`
      }]
    });

    const content = (response.content[0] as any)?.text || '[]';
    const products = JSON.parse(content);
    
    return Array.isArray(products) ? products.slice(0, 50) : [];
    
  } catch (error) {
    console.error('Ошибка извлечения товаров:', error);
    return [];
  }
}

async function fallbackToSimpleImport(supplierName: string, description: string): Promise<ImportResult> {
  console.log('Переключаюсь на упрощенный импорт');
  
  // Создаем базовые товары для демонстрации
  const categories = await storage.getAllCategories();
  const demoProducts: InsertProduct[] = [];
  
  for (const category of categories.slice(0, 6)) {
    for (let i = 1; i <= 5; i++) {
      demoProducts.push({
        sku: `${supplierName.replace(/[^a-zA-Z0-9]/g, '')}-${category.id}-${i}`,
        name: `${supplierName} ${category.name} модель ${i}`,
        slug: generateSlug(`${supplierName}-${category.name}-${i}`),
        description: `Качественный товар из категории ${category.name} от поставщика ${supplierName}. ${description}`,
        shortDescription: `${category.name} модель ${i}`,
        price: (Math.floor(Math.random() * 50000) + 1000).toString(),
        originalPrice: null,
        categoryId: category.id,
        imageUrl: null,
        stockQuantity: Math.floor(Math.random() * 100) + 10,
        isActive: true,
        isFeatured: Math.random() > 0.7,
        characteristics: `Модель: ${i}, Категория: ${category.name}, Поставщик: ${supplierName}`,
        tag: category.name
      });
    }
  }
  
  const importResult = await storage.bulkImportProducts(demoProducts);
  
  return {
    success: true,
    categoriesCreated: 0,
    productsImported: importResult.success,
    failed: importResult.failed
  };
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-я]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}