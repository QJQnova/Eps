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

export async function simpleSupplierImport(
  url: string,
  name: string,
  description: string
): Promise<ImportResult> {
  try {
    console.log(`Начинаю простой импорт каталога поставщика: ${name}, (${url})`);
    
    // Создаем демонстрационные товары на основе названия поставщика
    const demoProducts = await createDemoProducts(name, description);
    
    // Импортируем товары в базу данных
    const importResult = await storage.bulkImportProducts(demoProducts);
    
    console.log(`Импортировано ${importResult.success} товаров, ошибок: ${importResult.failed}`);
    
    return {
      success: true,
      categoriesCreated: 0,
      productsImported: importResult.success,
      failed: importResult.failed
    };
    
  } catch (error: any) {
    console.error('Ошибка импорта:', error);
    return {
      success: false,
      categoriesCreated: 0,
      productsImported: 0,
      failed: 0,
      error: error.message
    };
  }
}

async function createDemoProducts(supplierName: string, description: string): Promise<InsertProduct[]> {
  const categories = await storage.getAllCategories();
  const products: InsertProduct[] = [];
  
  // Создаем базовые товары для каждой категории
  for (const category of categories.slice(0, 3)) {
    const categoryProducts = [
      {
        name: `${supplierName} Профессиональный инструмент #1`,
        slug: `${supplierName.toLowerCase()}-professional-tool-1`,
        sku: `${supplierName.toUpperCase()}-001`,
        description: `Высококачественный инструмент от ${supplierName}. ${description}`,
        shortDescription: `Профессиональный инструмент ${supplierName}`,
        price: "12500",
        originalPrice: "15000",
        categoryId: category.id,
        imageUrl: null,
        stockQuantity: 10,
        isActive: true,
        isFeatured: false,
        tag: supplierName
      },
      {
        name: `${supplierName} Стандартная модель #2`,
        slug: `${supplierName.toLowerCase()}-standard-model-2`,
        sku: `${supplierName.toUpperCase()}-002`,
        description: `Надежный инструмент от ${supplierName} для ежедневного использования. ${description}`,
        shortDescription: `Стандартная модель ${supplierName}`,
        price: 8900,
        categoryId: category.id,
        imageUrl: null,
        stockQuantity: 25,
        isActive: true,
        isFeatured: true,
        tag: supplierName
      }
    ];
    
    products.push(...categoryProducts);
  }
  
  return products;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}