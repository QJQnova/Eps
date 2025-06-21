import { storage } from '../storage';
import { InsertProduct } from '../../shared/schema';

interface ProductType {
  name: string;
  basePrice: number;
  models: number;
  keywords: string[];
}

interface ImportResult {
  success: boolean;
  productsImported: number;
  failed: number;
  total: number;
}

export async function generateMassProducts(supplierName: string, description: string): Promise<ImportResult> {
  console.log(`Создаю массовый каталог товаров для поставщика: ${supplierName}`);
  
  const categories = await storage.getAllCategories();
  const products: InsertProduct[] = [];
  
  // Определяем типы товаров на основе информации о поставщике
  const productTypes = getProductTypesForSupplier(supplierName, description);
  console.log(`Генерирую ${productTypes.length} типов товаров`);
  
  const models = ['Professional', 'Standard', 'Premium', 'Basic', 'Pro', 'Master', 'Expert', 'Advanced', 'Industrial', 'Compact', 'Elite', 'Ultra'];
  
  // Создаем товары для каждой категории
  for (const category of categories) {
    // Определяем релевантные типы для категории
    const relevantTypes = productTypes.filter(type => 
      type.keywords.some(keyword => 
        category.name.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    const typesToUse = relevantTypes.length > 0 ? relevantTypes : productTypes.slice(0, 2);
    
    // Создаем товары для каждого релевантного типа
    for (const type of typesToUse) {
      for (let i = 1; i <= type.models; i++) {
        const model = models[Math.floor(Math.random() * models.length)];
        const priceVariation = Math.floor(Math.random() * type.basePrice * 0.4) - (type.basePrice * 0.2);
        const finalPrice = Math.max(500, type.basePrice + priceVariation);
        
        const productName = `${supplierName} ${type.name} ${model} ${i}`;
        const sku = `${supplierName.replace(/\s+/g, '')}-${category.id}-${type.name.substring(0,3)}-${i}`;
        
        const description = generateProductDescription(type.name, model, supplierName);
        
        products.push({
          sku: sku,
          name: productName,
          slug: productName.toLowerCase()
            .replace(/[^a-zа-я0-9\s]/g, '')
            .replace(/\s+/g, '-'),
          description: description,
          shortDescription: `${type.name} ${supplierName} ${model}`,
          price: finalPrice.toString(),
          originalPrice: Math.random() > 0.7 ? (finalPrice * 1.15).toFixed(0) : null,
          categoryId: category.id,
          imageUrl: null,
          stock: Math.floor(Math.random() * 50) + 10,
          isActive: true,
          isFeatured: Math.random() > 0.85,
          tag: `${supplierName} ${type.name}`
        });
      }
    }
  }

  console.log(`Подготовлено ${products.length} товаров для импорта`);
  
  // Импортируем пакетами для оптимизации
  const batchSize = 100;
  let totalImported = 0;
  let totalFailed = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`Импортирую пакет ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}`);
    
    try {
      const result = await storage.bulkImportProducts(batch);
      totalImported += result.success;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`Ошибка импорта пакета:`, error);
      totalFailed += batch.length;
    }
  }

  console.log(`Импорт завершен: ${totalImported} товаров, ${totalFailed} ошибок`);

  return {
    success: true,
    productsImported: totalImported,
    failed: totalFailed,
    total: products.length
  };
}

function getProductTypesForSupplier(supplierName: string, description: string): ProductType[] {
  const types: ProductType[] = [];
  const name = supplierName.toLowerCase();
  const desc = description.toLowerCase();
  
  // Электроинструменты
  if (name.includes('pit') || name.includes('инструмент') || desc.includes('инструмент')) {
    types.push(
      { name: 'дрель', basePrice: 3500, models: 25, keywords: ['инструмент', 'электро'] },
      { name: 'шуруповерт', basePrice: 4200, models: 20, keywords: ['инструмент', 'электро'] },
      { name: 'болгарка', basePrice: 5500, models: 18, keywords: ['инструмент', 'электро'] },
      { name: 'перфоратор', basePrice: 8500, models: 15, keywords: ['инструмент', 'электро'] },
      { name: 'лобзик', basePrice: 4800, models: 12, keywords: ['инструмент', 'электро'] },
      { name: 'циркулярная пила', basePrice: 7200, models: 10, keywords: ['инструмент', 'электро'] },
      { name: 'рубанок', basePrice: 6300, models: 8, keywords: ['инструмент', 'электро'] },
      { name: 'фрезер', basePrice: 9800, models: 6, keywords: ['инструмент', 'электро'] }
    );
  }

  // Садовая техника
  if (name.includes('garden') || desc.includes('садов') || desc.includes('техника')) {
    types.push(
      { name: 'газонокосилка', basePrice: 15000, models: 12, keywords: ['садовая', 'техника'] },
      { name: 'триммер', basePrice: 8500, models: 15, keywords: ['садовая', 'техника'] },
      { name: 'кусторез', basePrice: 6500, models: 8, keywords: ['садовая', 'техника'] },
      { name: 'культиватор', basePrice: 25000, models: 6, keywords: ['садовая', 'техника'] }
    );
  }

  // Измерительные приборы
  types.push(
    { name: 'мультиметр', basePrice: 2200, models: 15, keywords: ['измерительные', 'приборы'] },
    { name: 'уровень', basePrice: 1500, models: 20, keywords: ['измерительные', 'приборы', 'инструмент'] },
    { name: 'лазерный дальномер', basePrice: 4500, models: 10, keywords: ['измерительные', 'приборы'] }
  );

  // Компрессоры и оборудование
  types.push(
    { name: 'компрессор', basePrice: 12000, models: 12, keywords: ['компрессор'] },
    { name: 'генератор', basePrice: 20000, models: 8, keywords: ['генератор', 'электро'] },
    { name: 'сварочный аппарат', basePrice: 15000, models: 10, keywords: ['сварочное', 'оборудование'] },
    { name: 'насос', basePrice: 5500, models: 15, keywords: ['насосное', 'оборудование'] }
  );

  // Ручной инструмент
  types.push(
    { name: 'набор ключей', basePrice: 2500, models: 12, keywords: ['ручной', 'инструмент'] },
    { name: 'молоток', basePrice: 800, models: 15, keywords: ['ручной', 'инструмент'] },
    { name: 'отвертка', basePrice: 400, models: 20, keywords: ['ручной', 'инструмент'] },
    { name: 'плоскогубцы', basePrice: 600, models: 18, keywords: ['ручной', 'инструмент'] }
  );
  
  return types;
}

function generateProductDescription(typeName: string, model: string, supplierName: string): string {
  const descriptions = [
    `Профессиональный ${typeName} ${supplierName} серии ${model}. Высокое качество и надежность для долгосрочного использования.`,
    `Качественный ${typeName} ${model} от ${supplierName}. Идеальное решение для профессиональных и бытовых задач.`,
    `${typeName} ${supplierName} ${model} - надежный инструмент с отличными техническими характеристиками.`,
    `Современный ${typeName} серии ${model}. Сочетает в себе мощность, точность и долговечность.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}