import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq } from 'drizzle-orm';
import type { InsertCategory, InsertProduct } from './shared/schema';

// Данные товаров из Excel изображений
const excelImageData = [
  // Гайковёрты
  {
    name: "Гайковерт зукул бесщеточный DCK KDP604-10, 10.8В, 3/8\" 2*2Ач, 54нм",
    category: "Гайковерты",
    price: "14990",
    sku: "KDP604-10ITYPE-EK",
    description: "Гайковерт зукул бесщеточный DCK KDP604-10, 10.8В, 3/8\" с двумя аккумуляторами 2Ач, крутящий момент 54нм",
    code: "696454341"
  },
  
  // Шуруповёрты
  {
    name: "Дрель-шуруповерт зукул бесщеточная DCK KDZ23-10, 10.8В, 2*2Ач, 35нм, кейс",
    category: "Шуруповерты",
    price: "10290",
    sku: "KDZ23-10ITYPE-EK",
    description: "Дрель-шуруповерт зукул бесщеточная DCK KDZ23-10, 10.8В с комплектом 2*2Ач, крутящий момент 35нм, в кейсе",
    code: "696454315"
  },
  {
    name: "Дрель-шуруповерт зукул бесщеточная DCK KDZ23-10, 10.8В, 35нм, без АКБ и З/У",
    category: "Шуруповерты", 
    price: "5990",
    sku: "KDZ23-10ITYPE-Z",
    description: "Дрель-шуруповерт зукул бесщеточная DCK KDZ23-10, 10.8В, крутящий момент 35нм, без аккумулятора и зарядного устройства",
    code: "696454357"
  },
  {
    name: "Дрель-шуруповерт зукул бесщеточная ударная DCK KDZ23-10I, 10.8В, 2*2Ач, 35нм, кейс",
    category: "Шуруповерты",
    price: "11290",
    sku: "KDZ23-10ITYPE-EKI",
    description: "Дрель-шуруповерт зукул бесщеточная ударная DCK KDZ23-10I, 10.8В с комплектом 2*2Ач, крутящий момент 35нм, в кейсе",
    code: "10144115"
  },
  {
    name: "Дрель-шуруповерт зукул DCK KDP14-8 Impact, HEX 10.8В, 2*2Ач, кейс, 34нм", 
    category: "Шуруповерты",
    price: "12590",
    sku: "KDP14-8ITYPE-EK",
    description: "Дрель-шуруповерт зукул DCK KDP14-8 Impact, HEX 10.8В с комплектом 2*2Ач, в кейсе, крутящий момент 34нм",
    code: "696454312"
  },
  {
    name: "Дрель-шуруповерт зукул DCK KDP14-8 Impact, HEX 10.8В, 34нм, без АКБ и З/У",
    category: "Шуруповерты",
    price: "6590",
    sku: "KDP14-8ITYPE-Z",
    description: "Дрель-шуруповерт зукул DCK KDP14-8 Impact, HEX 10.8В, крутящий момент 34нм, без аккумулятора и зарядного устройства",
    code: "696454356"
  },
  {
    name: "Дрель-шуруповерт зукул бесщеточная ударная DCK KDZ20-10I, 18В, 2*2Ач, 125нм кейс",
    category: "Шуруповерты",
    price: "25990",
    sku: "KDZ20-10ITYPE-FK",
    description: "Дрель-шуруповерт зукул бесщеточная ударная DCK KDZ20-10I, 18В с комплектом 2*2Ач, крутящий момент 125нм, в кейсе",
    code: "696454583"
  },

  // Инструменты универсальные
  {
    name: "Гравер аккумуляторный DCK KDS10, 10.8В, 2*2Ач, шайба 32мм",
    category: "Многофункциональные инструменты",
    price: "10290",
    sku: "KDS10ITYPE-EK",
    description: "Гравер аккумуляторный DCK KDS10, 10.8В с комплектом 2*2Ач, диаметр шайбы 32мм",
    code: "696454584"
  },
  {
    name: "Гравер аккумуляторный DCK KDS10, 10.8В, шайба 32мм, без АКБ и З/У",
    category: "Многофункциональные инструменты", 
    price: "4990",
    sku: "KDS10ITYPE-Z",
    description: "Гравер аккумуляторный DCK KDS10, 10.8В, диаметр шайбы 32мм, без аккумулятора и зарядного устройства",
    code: "696454359"
  },
  {
    name: "Инструмент многофункциональный зукул DCK KDM012, 10.8В, 2*2Ач, 8 скоростей",
    category: "Многофункциональные инструменты",
    price: "13590",
    sku: "KDM012ITYPE-EK",
    description: "Инструмент многофункциональный зукул DCK KDM012, 10.8В с комплектом 2*2Ач, 8 скоростей",
    code: "696454085"
  },
  {
    name: "Заклепочник ручной зукул DCK KDM950, 10.8В, 1000Н, 2.4-5мм",
    category: "Многофункциональные инструменты",
    price: "17950",
    sku: "KDM950ITYPE-Z",
    description: "Заклепочник ручной зукул DCK KDM950, 10.8В, усилие 1000Н, диаметр заклепок 2.4-5мм",
    code: "696454358"
  },
  {
    name: "Заклепочник ручной зукул DCK KDM950, 10.8В, 2*7Ач, 1000Н, 2.4-5мм",
    category: "Многофункциональные инструменты",
    price: "25990",
    sku: "KDM950ITYPE-EK",
    description: "Заклепочник ручной зукул DCK KDM950, 10.8В с комплектом 2*7Ач, усилие 1000Н, диаметр заклепок 2.4-5мм",
    code: "696454086"
  }
];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getCategoryId(categoryName: string): Promise<number> {
  const existing = await db.select()
    .from(categories)
    .where(eq(categories.name, categoryName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Если категория не найдена, создаем её
  const newCategory: InsertCategory = {
    name: categoryName,
    slug: generateSlug(categoryName),
    description: `Категория ${categoryName}`,
    icon: null,
    productCount: 0
  };

  const [created] = await db.insert(categories).values(newCategory).returning();
  console.log(`Создана новая категория: ${categoryName}`);
  return created.id;
}

async function importExcelImageData() {
  try {
    console.log('Начинаем импорт товаров DCK из Excel изображений...');
    
    let imported = 0;
    let skipped = 0;

    for (const item of excelImageData) {
      try {
        // Получаем ID категории (создаем если не существует)
        const categoryId = await getCategoryId(item.category);

        // Проверяем, не существует ли уже товар с таким SKU
        const existingProduct = await db.select()
          .from(products)
          .where(eq(products.sku, item.sku))
          .limit(1);

        if (existingProduct.length > 0) {
          console.log(`Товар с SKU ${item.sku} уже существует, пропускаем`);
          skipped++;
          continue;
        }

        // Создаем уникальный slug для продукта
        const baseSlug = generateSlug(item.name);
        let finalSlug = baseSlug;
        let slugCounter = 1;

        // Проверяем уникальность slug продукта
        while (true) {
          const existingSlug = await db.select()
            .from(products)
            .where(eq(products.slug, finalSlug))
            .limit(1);

          if (existingSlug.length === 0) break;
          
          finalSlug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // Создаем товар
        const productData: InsertProduct = {
          sku: item.sku,
          name: item.name,
          slug: finalSlug,
          description: item.description,
          shortDescription: item.description.substring(0, 100),
          price: item.price,
          originalPrice: null,
          imageUrl: null,
          stock: Math.floor(Math.random() * 50) + 10, // Случайный остаток 10-60
          categoryId: categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.7, // 30% шанс быть рекомендуемым
          tag: 'imported-excel-images-dck'
        };

        await db.insert(products).values(productData);
        imported++;

        console.log(`Импортирован: ${item.name} в категорию ${item.category}`);

      } catch (error) {
        console.error(`Ошибка при импорте товара ${item.name}:`, error);
        skipped++;
      }
    }

    // Обновляем счетчики товаров в категориях
    console.log('Обновляем счетчики товаров в категориях...');
    await db.execute(`
      UPDATE categories 
      SET product_count = (
        SELECT COUNT(*) 
        FROM products 
        WHERE category_id = categories.id
      )
    `);

    console.log(`\n=== РЕЗУЛЬТАТЫ ИМПОРТА ИЗ EXCEL ИЗОБРАЖЕНИЙ ===`);
    console.log(`Импортировано товаров: ${imported}`);
    console.log(`Пропущено: ${skipped}`);
    console.log(`Всего обработано: ${excelImageData.length}`);

    return {
      imported,
      skipped,
      total: excelImageData.length
    };

  } catch (error) {
    console.error('Критическая ошибка при импорте из Excel изображений:', error);
    throw error;
  }
}

// Запускаем импорт
importExcelImageData()
  .then(result => {
    console.log('\n✅ Импорт из Excel изображений завершен успешно!');
    console.log('Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Ошибка импорта из Excel изображений:', error);
    process.exit(1);
  });