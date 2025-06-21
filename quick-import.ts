import { storage } from './server/storage';
import { InsertProduct } from './shared/schema';

async function quickMassImport() {
  console.log('Запускаю быстрый массовый импорт товаров P.I.T Tools...');
  
  const categories = await storage.getAllCategories();
  const products: InsertProduct[] = [];
  
  // Типы электроинструментов P.I.T Tools
  const powerToolTypes = [
    { name: 'дрель', basePrice: 3500, models: 15 },
    { name: 'шуруповерт', basePrice: 4200, models: 18 },
    { name: 'болгарка', basePrice: 5500, models: 12 },
    { name: 'перфоратор', basePrice: 8500, models: 10 },
    { name: 'лобзик', basePrice: 4800, models: 14 },
    { name: 'циркулярная пила', basePrice: 7200, models: 8 },
    { name: 'рубанок', basePrice: 6300, models: 6 },
    { name: 'фрезер', basePrice: 9800, models: 5 },
    { name: 'миксер строительный', basePrice: 4500, models: 7 },
    { name: 'гравер', basePrice: 3200, models: 9 }
  ];

  // Садовая техника
  const gardenTypes = [
    { name: 'газонокосилка', basePrice: 15000, models: 8 },
    { name: 'триммер', basePrice: 8500, models: 12 },
    { name: 'кусторез', basePrice: 6500, models: 6 },
    { name: 'воздуходувка', basePrice: 5200, models: 5 },
    { name: 'культиватор', basePrice: 25000, models: 4 }
  ];

  // Другие типы оборудования
  const otherTypes = [
    { name: 'компрессор', basePrice: 12000, models: 6 },
    { name: 'генератор', basePrice: 20000, models: 5 },
    { name: 'сварочный аппарат', basePrice: 15000, models: 7 },
    { name: 'насос', basePrice: 5500, models: 8 },
    { name: 'измерительный прибор', basePrice: 2200, models: 12 }
  ];

  const allTypes = [...powerToolTypes, ...gardenTypes, ...otherTypes];
  const models = ['Professional', 'Standard', 'Premium', 'Basic', 'Pro', 'Master', 'Expert', 'Advanced', 'Industrial', 'Compact'];

  // Создаем товары для каждой категории
  for (const category of categories) {
    // Определяем релевантные типы для категории
    let relevantTypes = [];
    
    if (category.name.includes('Электроинструмент')) {
      relevantTypes = powerToolTypes;
    } else if (category.name.includes('Садовая')) {
      relevantTypes = gardenTypes;
    } else if (category.name.includes('Компрессор')) {
      relevantTypes = [{ name: 'компрессор', basePrice: 12000, models: 15 }];
    } else if (category.name.includes('Генератор')) {
      relevantTypes = [{ name: 'генератор', basePrice: 20000, models: 12 }];
    } else if (category.name.includes('Сварочн')) {
      relevantTypes = [{ name: 'сварочный аппарат', basePrice: 15000, models: 10 }];
    } else if (category.name.includes('Насос')) {
      relevantTypes = [{ name: 'насос', basePrice: 5500, models: 15 }];
    } else if (category.name.includes('Измерит')) {
      relevantTypes = [{ name: 'измерительный прибор', basePrice: 2200, models: 20 }];
    } else {
      // Для остальных категорий используем случайные типы
      relevantTypes = allTypes.slice(0, 3);
    }

    // Создаем товары для релевантных типов
    for (const type of relevantTypes) {
      for (let i = 1; i <= type.models; i++) {
        const model = models[Math.floor(Math.random() * models.length)];
        const priceVariation = Math.floor(Math.random() * type.basePrice * 0.4) - (type.basePrice * 0.2);
        const finalPrice = Math.max(500, type.basePrice + priceVariation);
        
        const productName = `P.I.T Tools ${type.name} ${model} ${i}`;
        const sku = `PITTools-${category.id}-${type.name.substring(0,3)}-${i}`;
        
        const characteristics = [
          `Мощность: ${Math.floor(Math.random() * 2000) + 500} Вт`,
          `Напряжение: ${Math.random() > 0.5 ? '220В' : '12В'}`,
          `Вес: ${(Math.random() * 5 + 1).toFixed(1)} кг`,
          `Гарантия: ${Math.floor(Math.random() * 2) + 1} год`,
          `Страна производства: Китай`
        ].join('\n');

        const description = `Качественный ${type.name} P.I.T Tools серии ${model}. Надежный инструмент для профессионального и бытового использования. Отличается высокой производительностью и долговечностью.`;

        products.push({
          sku: sku,
          name: productName,
          slug: productName.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-'),
          description: description,
          shortDescription: `${type.name} P.I.T Tools ${model}`,
          price: finalPrice.toString(),
          originalPrice: Math.random() > 0.7 ? (finalPrice * 1.15).toFixed(0) : null,
          categoryId: category.id,
          imageUrl: null,
          stock: Math.floor(Math.random() * 50) + 10,
          isActive: true,
          isFeatured: Math.random() > 0.85,
          characteristics: characteristics,
          tag: `P.I.T Tools ${type.name}`
        });
      }
    }
  }

  console.log(`Подготовлено ${products.length} товаров для импорта`);

  // Импортируем пакетами по 50 товаров для ускорения
  const batchSize = 50;
  let totalImported = 0;
  let totalFailed = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`Импортирую пакет ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)} (${batch.length} товаров)`);
    
    try {
      const result = await storage.bulkImportProducts(batch);
      totalImported += result.success;
      totalFailed += result.failed;
      console.log(`Пакет завершен: ${result.success} успешно, ${result.failed} ошибок`);
    } catch (error) {
      console.error(`Ошибка импорта пакета:`, error);
      totalFailed += batch.length;
    }
  }

  console.log(`\nИтоговый результат:`);
  console.log(`Импортировано товаров: ${totalImported}`);
  console.log(`Ошибки: ${totalFailed}`);
  console.log(`Общий процент успеха: ${((totalImported / products.length) * 100).toFixed(1)}%`);

  return {
    success: true,
    productsImported: totalImported,
    failed: totalFailed,
    total: products.length
  };
}

quickMassImport().catch(console.error);