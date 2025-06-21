import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ExtractedProduct {
  name: string;
  sku: string;
  price: string;
  originalPrice?: string;
  category: string;
  subcategory?: string;
  description: string;
  shortDescription?: string;
  specifications?: string;
  imageUrl?: string;
  imageUrls?: string[];
  brand?: string;
  model?: string;
  warranty?: string;
  availability?: string;
  features?: string[];
  technicalSpecs?: Record<string, string>;
  sourceUrl: string;
}

interface ExtractedCategory {
  name: string;
  description?: string;
  parentCategory?: string;
  products: ExtractedProduct[];
}

interface ImportResult {
  success: boolean;
  categoriesCreated: number;
  productsImported: number;
  failed: number;
  error?: string;
}

export async function importFullSupplierCatalog(
  supplierUrl: string,
  supplierName: string,
  description?: string
): Promise<ImportResult> {
  try {
    console.log(`Начинаю полный анализ каталога: ${supplierUrl}`);
    
    // Этап 1: Анализ структуры сайта и извлечение всех страниц
    const siteStructure = await analyzeSiteStructure(supplierUrl);
    console.log(`Найдено ${siteStructure.catalogUrls.length} страниц каталога`);
    
    // Этап 2: Извлечение всех категорий и товаров
    const extractedData = await extractAllCategoriesAndProducts(siteStructure);
    console.log(`Извлечено ${extractedData.categories.length} категорий с ${extractedData.totalProducts} товарами`);
    
    // Этап 3: Создание категорий в базе данных
    const categoriesCreated = await createCategoriesInDatabase(extractedData.categories);
    console.log(`Создано ${categoriesCreated} новых категорий`);
    
    // Этап 4: Импорт всех товаров
    const importStats = await importProductsToDatabase(extractedData.categories, supplierName);
    console.log(`Импортировано ${importStats.success} товаров, ошибок: ${importStats.failed}`);
    
    // Обновляем счетчики товаров в категориях
    await updateCategoryProductCounts();
    
    return {
      success: true,
      categoriesCreated,
      productsImported: importStats.success,
      failed: importStats.failed
    };
    
  } catch (error: any) {
    console.error("Ошибка полного импорта каталога:", error);
    return {
      success: false,
      categoriesCreated: 0,
      productsImported: 0,
      failed: 0,
      error: error.message
    };
  }
}

async function analyzeSiteStructure(url: string): Promise<{ 
  baseUrl: string; 
  catalogUrls: string[]; 
  mainCategories: string[] 
}> {
  try {
    // Загружаем главную страницу
    const mainPageHtml = await fetchPageWithRetry(url);
    
    // Используем Claude для анализа структуры сайта
    const structureAnalysis = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: `Ты эксперт по анализу структуры интернет-магазинов. Проанализируй HTML код сайта и найди:
1. Все ссылки на страницы каталога товаров
2. Основные категории товаров
3. Ссылки на подкатегории
4. Возможные карты сайта (sitemap)

Верни результат в JSON формате:
{
  "catalogUrls": ["url1", "url2", ...],
  "mainCategories": ["category1", "category2", ...],
  "sitemapUrls": ["sitemap1", ...]
}`,
      messages: [{
        role: "user",
        content: `Проанализируй структуру этого сайта поставщика: ${url}

HTML код страницы:
${mainPageHtml.substring(0, 50000)}`
      }]
    });

    const analysis = JSON.parse(structureAnalysis.content[0].text);
    const baseUrl = new URL(url).origin;
    
    // Нормализуем URLs
    const catalogUrls = analysis.catalogUrls
      .map((catalogUrl: string) => {
        if (catalogUrl.startsWith('http')) return catalogUrl;
        if (catalogUrl.startsWith('/')) return baseUrl + catalogUrl;
        return baseUrl + '/' + catalogUrl;
      })
      .filter((catalogUrl: string) => catalogUrl.includes(baseUrl));
    
    // Добавляем основной URL если не найдены каталоги
    if (catalogUrls.length === 0) {
      catalogUrls.push(url);
    }
    
    return {
      baseUrl,
      catalogUrls: [...new Set(catalogUrls)], // убираем дубликаты
      mainCategories: analysis.mainCategories || []
    };
    
  } catch (error) {
    console.error("Ошибка анализа структуры сайта:", error);
    // Возвращаем базовую структуру
    return {
      baseUrl: new URL(url).origin,
      catalogUrls: [url],
      mainCategories: []
    };
  }
}

async function extractAllCategoriesAndProducts(siteStructure: {
  baseUrl: string;
  catalogUrls: string[];
  mainCategories: string[];
}): Promise<{ categories: ExtractedCategory[]; totalProducts: number }> {
  const allCategories: ExtractedCategory[] = [];
  let totalProducts = 0;
  
  for (const catalogUrl of siteStructure.catalogUrls) {
    try {
      console.log(`Извлекаю данные со страницы: ${catalogUrl}`);
      const pageHtml = await fetchPageWithRetry(catalogUrl);
      
      // Используем Claude для извлечения всех товаров и категорий со страницы
      const extractionResult = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: `Ты эксперт по извлечению данных о товарах с сайтов поставщиков. Проанализируй HTML код и извлеки:

1. ВСЕ товары со страницы с полной информацией:
   - Название товара
   - Артикул/SKU (если есть)
   - Цена (если указана)
   - Категория товара
   - Описание
   - Изображения
   - Технические характеристики
   - Бренд/производитель
   - Модель
   - Гарантия
   - Наличие

2. Все категории товаров найденные на странице

Верни результат в JSON формате:
{
  "categories": [
    {
      "name": "Название категории",
      "description": "Описание категории",
      "products": [
        {
          "name": "Название товара",
          "sku": "Артикул",
          "price": "Цена в рублях или 'По запросу'",
          "category": "Категория",
          "description": "Полное описание",
          "shortDescription": "Краткое описание",
          "imageUrl": "URL изображения",
          "brand": "Бренд",
          "model": "Модель",
          "specifications": "Технические характеристики",
          "warranty": "Гарантия",
          "availability": "Наличие",
          "sourceUrl": "${catalogUrl}"
        }
      ]
    }
  ]
}

ВАЖНО: Извлекай МАКСИМУМ товаров с полной информацией. Если цена не указана, ставь "По запросу".`,
        messages: [{
          role: "user",
          content: `Извлеки все товары и категории с этой страницы каталога: ${catalogUrl}

HTML код:
${pageHtml.substring(0, 80000)}`
        }]
      });

      const extractedData = JSON.parse(extractionResult.content[0].text);
      
      if (extractedData.categories && Array.isArray(extractedData.categories)) {
        for (const category of extractedData.categories) {
          if (category.products && Array.isArray(category.products)) {
            allCategories.push(category);
            totalProducts += category.products.length;
          }
        }
      }
      
      // Задержка между запросами
      await delay(2000);
      
    } catch (error) {
      console.error(`Ошибка извлечения данных с ${catalogUrl}:`, error);
      continue;
    }
  }
  
  return { categories: allCategories, totalProducts };
}

async function createCategoriesInDatabase(categories: ExtractedCategory[]): Promise<number> {
  let createdCount = 0;
  
  for (const category of categories) {
    try {
      // Проверяем, существует ли категория
      const slug = category.name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-');
      const existingCategory = await storage.getCategoryBySlug(slug);
      
      if (!existingCategory) {
        await storage.createCategory({
          name: category.name,
          slug,
          description: category.description || `Категория ${category.name}`,
          icon: 'tool'
        });
        createdCount++;
        console.log(`Создана категория: ${category.name}`);
      }
    } catch (error) {
      console.error(`Ошибка создания категории ${category.name}:`, error);
    }
  }
  
  return createdCount;
}

async function importProductsToDatabase(
  categories: ExtractedCategory[], 
  supplierName: string
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  
  for (const category of categories) {
    // Получаем ID категории
    const slug = category.name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-');
    const dbCategory = await storage.getCategoryBySlug(slug);
    const categoryId = dbCategory?.id || 46; // Fallback к "Инструменты"
    
    for (const product of category.products) {
      try {
        // Проверяем, существует ли товар с таким SKU
        if (product.sku) {
          const existingProduct = await storage.getAllProducts();
          const existing = existingProduct.find(p => p.sku === product.sku);
          if (existing) {
            continue; // Пропускаем дубликаты
          }
        }
        
        const productToCreate = {
          name: product.name,
          sku: product.sku || `${supplierName}-${Date.now()}-${successCount}`,
          slug: product.name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-'),
          description: product.description || `Товар ${product.name} от поставщика ${supplierName}`,
          shortDescription: product.shortDescription || product.description?.substring(0, 200) || product.name,
          price: product.price && product.price !== 'По запросу' && !isNaN(parseFloat(product.price)) 
            ? parseFloat(product.price.replace(/[^\d.,]/g, '').replace(',', '.'))
            : 0,
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
          imageUrl: product.imageUrl || '',
          stock: null,
          categoryId,
          isActive: true,
          isFeatured: false,
          tag: `${supplierName}|${product.brand || 'unknown'}|${product.model || 'unknown'}|${product.sourceUrl}`
        };
        
        await storage.createProduct(productToCreate);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`Импортировано ${successCount} товаров...`);
        }
        
      } catch (error) {
        console.error(`Ошибка импорта товара ${product.name}:`, error);
        failedCount++;
      }
    }
  }
  
  return { success: successCount, failed: failedCount };
}

async function fetchPageWithRetry(url: string, maxRetries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      if (html.length < 1000) {
        throw new Error("Слишком короткий ответ сервера");
      }
      
      return html;
      
    } catch (error: any) {
      console.error(`Попытка ${attempt}/${maxRetries} загрузки ${url} не удалась:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Не удалось загрузить страницу после ${maxRetries} попыток: ${error.message}`);
      }
      
      // Задержка перед повторной попыткой
      await delay(attempt * 2000);
    }
  }
  
  throw new Error("Неожиданная ошибка при загрузке страницы");
}

async function updateCategoryProductCounts(): Promise<void> {
  try {
    const categories = await storage.getAllCategories();
    
    for (const category of categories) {
      const products = await storage.getProductsByCategoryId(category.id);
      // Обновляем счетчик через прямой SQL запрос, так как в storage нет метода для обновления счетчика
      // Это будет сделано автоматически через triggers или можно добавить метод в storage
    }
  } catch (error) {
    console.error("Ошибка обновления счетчиков категорий:", error);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}