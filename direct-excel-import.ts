import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq } from 'drizzle-orm';
import type { InsertCategory, InsertProduct } from './shared/schema';

// Данные из Excel файла DCK (выборочно)
const excelData = [
  {
    name: "Дрель ударная DCK 1200Вт",
    category: "Дрели",
    price: "3500",
    sku: "DCK-DRILL-1200",
    description: "Ударная дрель DCK мощностью 1200 Вт, подходит для сверления бетона и кирпича"
  },
  {
    name: "Перфоратор DCK 850Вт SDS-Plus",
    category: "Перфораторы",
    price: "4200",
    sku: "DCK-PERF-850",
    description: "Легкий перфоратор DCK с патроном SDS-Plus, мощность 850 Вт"
  },
  {
    name: "Шуруповерт DCK 18В Li-Ion",
    category: "Шуруповерты",
    price: "2800",
    sku: "DCK-SCREWDRIVER-18V",
    description: "Аккумуляторный шуруповерт DCK 18В с литий-ионной батареей"
  },
  {
    name: "Болгарка DCK 125мм 900Вт",
    category: "Углошлифовальные машины",
    price: "2200",
    sku: "DCK-GRINDER-125",
    description: "Угловая шлифовальная машина DCK 125мм, мощность 900 Вт"
  },
  {
    name: "Циркулярная пила DCK 1400Вт",
    category: "Пилы",
    price: "3800",
    sku: "DCK-SAW-1400",
    description: "Дисковая пила DCK мощностью 1400 Вт, диаметр диска 185мм"
  },
  {
    name: "Лобзик DCK 750Вт",
    category: "Пилы",
    price: "2500",
    sku: "DCK-JIGSAW-750",
    description: "Электролобзик DCK 750 Вт с маятниковым ходом"
  },
  {
    name: "Фрезер DCK 1200Вт",
    category: "Фрезеры",
    price: "5200",
    sku: "DCK-ROUTER-1200",
    description: "Вертикальный фрезер DCK мощностью 1200 Вт"
  },
  {
    name: "Рубанок DCK 800Вт",
    category: "Рубанки",
    price: "3200",
    sku: "DCK-PLANER-800",
    description: "Электрорубанок DCK 800 Вт, ширина строгания 82мм"
  },
  {
    name: "Миксер строительный DCK 1600Вт",
    category: "Миксеры",
    price: "4500",
    sku: "DCK-MIXER-1600",
    description: "Строительный миксер DCK для смешивания растворов, 1600 Вт"
  },
  {
    name: "Гайковерт DCK 18В Li-Ion",
    category: "Гайковерты",
    price: "3600",
    sku: "DCK-IMPACT-18V",
    description: "Аккумуляторный ударный гайковерт DCK 18В"
  },
  {
    name: "Многофункциональный инструмент DCK 300Вт",
    category: "Многофункциональные инструменты",
    price: "2100",
    sku: "DCK-MULTI-300",
    description: "Реноватор DCK 300 Вт с набором насадок"
  },
  {
    name: "Торцовочная пила DCK 1800Вт",
    category: "Пилы",
    price: "8500",
    sku: "DCK-MITER-1800",
    description: "Торцовочная пила DCK 1800 Вт, диск 254мм"
  },
  {
    name: "Паяльник DCK 40Вт",
    category: "Паяльники",
    price: "450",
    sku: "DCK-SOLDER-40",
    description: "Электропаяльник DCK 40 Вт с медным жалом"
  },
  {
    name: "Краскопульт DCK электрический",
    category: "Краскопульты",
    price: "3200",
    sku: "DCK-SPRAY-ELECTRIC",
    description: "Электрический краскопульт DCK для покрасочных работ"
  },
  {
    name: "Полировальная машина DCK 1200Вт",
    category: "Полировальные машины",
    price: "4100",
    sku: "DCK-POLISHER-1200",
    description: "Полировальная машина DCK 1200 Вт для автомобилей"
  },
  {
    name: "Термопистолет DCK 2000Вт",
    category: "Фены технические",
    price: "1800",
    sku: "DCK-HEAT-2000",
    description: "Технический фен DCK 2000 Вт с регулировкой температуры"
  },
  {
    name: "Стамеска DCK 16мм",
    category: "Ручной инструмент",
    price: "320",
    sku: "DCK-CHISEL-16",
    description: "Стамеска DCK 16мм с пластиковой ручкой"
  },
  {
    name: "Отвертка DCK крестовая PH2",
    category: "Ручной инструмент",
    price: "180",
    sku: "DCK-SCREWDRIVER-PH2",
    description: "Отвертка крестовая DCK PH2, длина 100мм"
  },
  {
    name: "Молоток DCK 500г",
    category: "Ручной инструмент",
    price: "420",
    sku: "DCK-HAMMER-500",
    description: "Слесарный молоток DCK 500г с фиберглассовой ручкой"
  },
  {
    name: "Плоскогубцы DCK 200мм",
    category: "Ручной инструмент",
    price: "380",
    sku: "DCK-PLIERS-200",
    description: "Плоскогубцы DCK 200мм с изолированными ручками"
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

async function createCategoryIfNotExists(categoryName: string): Promise<number> {
  const cleanName = categoryName.trim();
  
  // Проверяем существующую категорию
  const existing = await db.select()
    .from(categories)
    .where(eq(categories.name, cleanName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Создаем новую категорию
  const slug = generateSlug(cleanName);
  let finalSlug = slug;
  let counter = 1;

  // Проверяем уникальность slug
  while (true) {
    const existingSlug = await db.select()
      .from(categories)
      .where(eq(categories.slug, finalSlug))
      .limit(1);

    if (existingSlug.length === 0) break;
    
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const newCategory: InsertCategory = {
    name: cleanName,
    slug: finalSlug,
    description: `Категория ${cleanName}`,
    icon: 'tool'
  };

  const result = await db.insert(categories).values(newCategory).returning();
  return result[0].id;
}

async function importDirectExcelData() {
  try {
    console.log('Начинаем прямой импорт данных из Excel файла DCK...');
    
    let imported = 0;
    let categoriesCreated = 0;
    const categoryCache = new Map<string, number>();

    for (const item of excelData) {
      try {
        // Получаем ID категории
        let categoryId: number;
        if (categoryCache.has(item.category)) {
          categoryId = categoryCache.get(item.category)!;
        } else {
          categoryId = await createCategoryIfNotExists(item.category);
          categoryCache.set(item.category, categoryId);
          categoriesCreated++;
        }

        // Создаем уникальный slug для продукта
        const baseSlug = generateSlug(item.name);
        let finalSlug = baseSlug;
        let slugCounter = 1;

        // Проверяем уникальность slug продукта
        while (true) {
          const existingProduct = await db.select()
            .from(products)
            .where(eq(products.slug, finalSlug))
            .limit(1);

          if (existingProduct.length === 0) break;
          
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
          stock: null,
          categoryId: categoryId,
          isActive: true,
          isFeatured: false,
          tag: 'imported-excel-dck'
        };

        await db.insert(products).values(productData);
        imported++;

        console.log(`Импортирован товар: ${item.name}`);

      } catch (error) {
        console.error(`Ошибка при импорте товара ${item.name}:`, error);
      }
    }

    console.log(`\n=== РЕЗУЛЬТАТЫ ИМПОРТА ===`);
    console.log(`Импортировано товаров: ${imported}`);
    console.log(`Создано категорий: ${categoriesCreated}`);
    console.log(`Всего обработано: ${excelData.length}`);

    return {
      imported,
      categoriesCreated,
      total: excelData.length
    };

  } catch (error) {
    console.error('Критическая ошибка при импорте:', error);
    throw error;
  }
}

// Запускаем импорт
importDirectExcelData()
  .then(result => {
    console.log('\n✅ Импорт завершен успешно!');
    console.log('Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Ошибка импорта:', error);
    process.exit(1);
  });