import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq } from 'drizzle-orm';
import type { InsertCategory, InsertProduct } from './shared/schema';

// Расширенные данные товаров для всех категорий
const extendedExcelData = [
  // Дрели - добавляем больше
  { name: "Дрель ударная DCK 1500Вт Pro", category: "Дрели", price: "4200", sku: "DCK-DRILL-1500-PRO", description: "Профессиональная ударная дрель DCK 1500 Вт с металлическим редуктором" },
  { name: "Дрель безударная DCK 800Вт", category: "Дрели", price: "2800", sku: "DCK-DRILL-800", description: "Дрель DCK 800 Вт для точного сверления без удара" },
  { name: "Дрель аккумуляторная DCK 12В", category: "Дрели", price: "3200", sku: "DCK-DRILL-12V", description: "Аккумуляторная дрель DCK 12В Li-Ion с двумя батареями" },
  { name: "Дрель-миксер DCK 1600Вт", category: "Дрели", price: "5500", sku: "DCK-DRILL-MIXER-1600", description: "Мощная дрель-миксер DCK для смешивания тяжелых растворов" },

  // Перфораторы - добавляем больше
  { name: "Перфоратор DCK 1200Вт SDS-Max", category: "Перфораторы", price: "8500", sku: "DCK-PERF-1200-MAX", description: "Тяжелый перфоратор DCK SDS-Max для серьезных работ" },
  { name: "Перфоратор DCK 650Вт компактный", category: "Перфораторы", price: "3800", sku: "DCK-PERF-650-COMPACT", description: "Компактный перфоратор DCK 650 Вт для домашних работ" },
  { name: "Перфоратор аккумуляторный DCK 18В", category: "Перфораторы", price: "6200", sku: "DCK-PERF-18V", description: "Беспроводной перфоратор DCK 18В с быстрозажимным патроном" },

  // Шуруповерты - добавляем больше
  { name: "Шуруповерт DCK 12В компактный", category: "Шуруповерты", price: "2200", sku: "DCK-SCREWDRIVER-12V", description: "Компактный шуруповерт DCK 12В для легких работ" },
  { name: "Шуруповерт ударный DCK 20В", category: "Шуруповерты", price: "3500", sku: "DCK-IMPACT-DRIVER-20V", description: "Ударный шуруповерт DCK 20В для крепежа в твердые материалы" },
  { name: "Шуруповерт сетевой DCK 500Вт", category: "Шуруповерты", price: "1800", sku: "DCK-SCREWDRIVER-500W", description: "Сетевой шуруповерт DCK 500 Вт для интенсивной работы" },

  // Углошлифовальные машины - добавляем больше
  { name: "Болгарка DCK 230мм 2000Вт", category: "Углошлифовальные машины", price: "4200", sku: "DCK-GRINDER-230", description: "Мощная болгарка DCK 230мм для резки металла и камня" },
  { name: "Болгарка DCK 115мм 750Вт", category: "Углошлифовальные машины", price: "1800", sku: "DCK-GRINDER-115", description: "Компактная болгарка DCK 115мм для точных работ" },
  { name: "Болгарка аккумуляторная DCK 125мм 18В", category: "Углошлифовальные машины", price: "3200", sku: "DCK-GRINDER-125-18V", description: "Беспроводная болгарка DCK 125мм с литиевым аккумулятором" },

  // Пилы - добавляем больше (уже есть 3, добавим еще)
  { name: "Сабельная пила DCK 1100Вт", category: "Пилы", price: "3200", sku: "DCK-RECIPROCATING-1100", description: "Сабельная пила DCK для демонтажных работ" },
  { name: "Цепная пила DCK 2200Вт", category: "Пилы", price: "6800", sku: "DCK-CHAINSAW-2200", description: "Электрическая цепная пила DCK для распила древесины" },
  { name: "Пила погружная DCK 1400Вт", category: "Пилы", price: "4500", sku: "DCK-PLUNGE-SAW-1400", description: "Погружная циркулярная пила DCK с направляющей шиной" },

  // Гайковерты - добавляем больше
  { name: "Гайковерт пневматический DCK 1/2\"", category: "Гайковерты", price: "2800", sku: "DCK-PNEUMATIC-WRENCH", description: "Пневматический гайковерт DCK 1/2 дюйма для автосервиса" },
  { name: "Гайковерт сетевой DCK 800Вт", category: "Гайковерты", price: "2200", sku: "DCK-ELECTRIC-WRENCH-800", description: "Электрический гайковерт DCK 800 Вт для тяжелых болтов" },
  { name: "Гайковерт компактный DCK 12В", category: "Гайковерты", price: "2500", sku: "DCK-COMPACT-WRENCH-12V", description: "Компактный аккумуляторный гайковерт DCK 12В" },

  // Фрезеры - добавляем больше
  { name: "Фрезер погружной DCK 1800Вт", category: "Фрезеры", price: "6200", sku: "DCK-PLUNGE-ROUTER-1800", description: "Мощный погружной фрезер DCK с точной регулировкой глубины" },
  { name: "Фрезер кромочный DCK 600Вт", category: "Фрезеры", price: "3800", sku: "DCK-EDGE-ROUTER-600", description: "Кромочный фрезер DCK для обработки краев изделий" },
  { name: "Фрезер ламельный DCK 900Вт", category: "Фрезеры", price: "4500", sku: "DCK-BISCUIT-JOINER-900", description: "Ламельный фрезер DCK для соединения деталей" },

  // Рубанки - добавляем больше
  { name: "Рубанок DCK 1200Вт широкий", category: "Рубанки", price: "4200", sku: "DCK-PLANER-1200-WIDE", description: "Электрорубанок DCK 1200 Вт, ширина строгания 110мм" },
  { name: "Рубанок аккумуляторный DCK 18В", category: "Рубанки", price: "3800", sku: "DCK-PLANER-18V", description: "Беспроводной рубанок DCK 18В для мобильных работ" },
  { name: "Рубанок-фуганок DCK 1500Вт", category: "Рубанки", price: "8500", sku: "DCK-JOINTER-1500", description: "Настольный электрорубанок-фуганок DCK" },

  // Миксеры - добавляем больше
  { name: "Миксер DCK 1800Вт двухшпиндельный", category: "Миксеры", price: "5500", sku: "DCK-DUAL-MIXER-1800", description: "Двухшпиндельный миксер DCK для больших объемов" },
  { name: "Миксер компактный DCK 1200Вт", category: "Миксеры", price: "3200", sku: "DCK-COMPACT-MIXER-1200", description: "Компактный строительный миксер DCK" },
  { name: "Миксер для красок DCK 800Вт", category: "Миксеры", price: "2800", sku: "DCK-PAINT-MIXER-800", description: "Специализированный миксер DCK для красок и лаков" },

  // Многофункциональные инструменты - добавляем больше
  { name: "Реноватор DCK 400Вт Pro", category: "Многофункциональные инструменты", price: "2800", sku: "DCK-MULTI-400-PRO", description: "Профессиональный реноватор DCK с большим набором насадок" },
  { name: "Многофункциональный инструмент DCK 200Вт", category: "Многофункциональные инструменты", price: "1800", sku: "DCK-MULTI-200", description: "Базовый многофункциональный инструмент DCK" },
  { name: "Реноватор аккумуляторный DCK 12В", category: "Многофункциональные инструменты", price: "2500", sku: "DCK-MULTI-12V", description: "Беспроводной реноватор DCK 12В для точных работ" },

  // Паяльники - добавляем больше
  { name: "Паяльник DCK 60Вт с регулировкой", category: "Паяльники", price: "650", sku: "DCK-SOLDER-60-ADJ", description: "Паяльник DCK 60 Вт с регулировкой температуры" },
  { name: "Паяльная станция DCK 100Вт", category: "Паяльники", price: "1200", sku: "DCK-SOLDERING-STATION-100", description: "Цифровая паяльная станция DCK с ЖК дисплеем" },
  { name: "Паяльник газовый DCK портативный", category: "Паяльники", price: "850", sku: "DCK-GAS-SOLDER", description: "Портативный газовый паяльник DCK для полевых работ" },

  // Краскопульты - добавляем больше
  { name: "Краскопульт HVLP DCK профессиональный", category: "Краскопульты", price: "4500", sku: "DCK-HVLP-SPRAY-PRO", description: "Профессиональный краскопульт DCK HVLP с низким давлением" },
  { name: "Краскопульт аккумуляторный DCK 18В", category: "Краскопульты", price: "3800", sku: "DCK-CORDLESS-SPRAY-18V", description: "Беспроводной краскопульт DCK для мобильной покраски" },
  { name: "Краскопульт пневматический DCK", category: "Краскопульты", price: "2200", sku: "DCK-PNEUMATIC-SPRAY", description: "Пневматический краскопульт DCK для компрессора" },

  // Полировальные машины - добавляем больше
  { name: "Полировальная машина DCK орбитальная 150мм", category: "Полировальные машины", price: "3500", sku: "DCK-ORBITAL-POLISHER-150", description: "Орбитальная полировальная машина DCK 150мм" },
  { name: "Полировальная машина DCK эксцентриковая", category: "Полировальные машины", price: "4800", sku: "DCK-ECCENTRIC-POLISHER", description: "Эксцентриковая полировальная машина DCK для кузовных работ" },
  { name: "Полировальная машина DCK угловая", category: "Полировальные машины", price: "3800", sku: "DCK-ANGLE-POLISHER", description: "Угловая полировальная машина DCK для труднодоступных мест" },

  // Фены технические - добавляем больше
  { name: "Термопистолет DCK 1500Вт компактный", category: "Фены технические", price: "1500", sku: "DCK-HEAT-1500-COMPACT", description: "Компактный технический фен DCK с двумя режимами" },
  { name: "Фен строительный DCK 2200Вт Pro", category: "Фены технические", price: "2200", sku: "DCK-HEAT-2200-PRO", description: "Профессиональный строительный фен DCK с ЖК дисплеем" },
  { name: "Термопистолет DCK с насадками", category: "Фены технические", price: "1800", sku: "DCK-HEAT-KIT", description: "Термопистолет DCK в комплекте с набором насадок" },

  // Ручной инструмент - добавляем больше (уже есть 4, добавим еще)
  { name: "Набор отверток DCK 12 предметов", category: "Ручной инструмент", price: "850", sku: "DCK-SCREWDRIVER-SET-12", description: "Набор отверток DCK: крестовые и плоские, 12 штук" },
  { name: "Ключи гаечные DCK 8-19мм", category: "Ручной инструмент", price: "1200", sku: "DCK-WRENCH-SET-8-19", description: "Набор рожковых ключей DCK от 8 до 19мм" },
  { name: "Пассатижи DCK 180мм", category: "Ручной инструмент", price: "420", sku: "DCK-PLIERS-180", description: "Пассатижи DCK 180мм с изолированными ручками" },
  { name: "Кусачки DCK боковые 160мм", category: "Ручной инструмент", price: "380", sku: "DCK-SIDE-CUTTERS-160", description: "Боковые кусачки DCK 160мм для проводов" },
  { name: "Уровень DCK 600мм", category: "Ручной инструмент", price: "680", sku: "DCK-LEVEL-600", description: "Строительный уровень DCK 600мм с тремя глазками" },
  { name: "Рулетка DCK 5м", category: "Ручной инструмент", price: "320", sku: "DCK-TAPE-5M", description: "Измерительная рулетка DCK 5 метров с магнитным крючком" }
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

  throw new Error(`Категория ${categoryName} не найдена`);
}

async function importExtendedExcelData() {
  try {
    console.log('Начинаем расширенный импорт товаров DCK...');
    
    let imported = 0;
    let skipped = 0;

    for (const item of extendedExcelData) {
      try {
        // Получаем ID существующей категории
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
          stock: null,
          categoryId: categoryId,
          isActive: true,
          isFeatured: false,
          tag: 'imported-excel-dck-extended'
        };

        await db.insert(products).values(productData);
        imported++;

        console.log(`Импортирован: ${item.name} в категорию ${item.category}`);

      } catch (error) {
        console.error(`Ошибка при импорте товара ${item.name}:`, error);
        skipped++;
      }
    }

    console.log(`\n=== РЕЗУЛЬТАТЫ РАСШИРЕННОГО ИМПОРТА ===`);
    console.log(`Импортировано товаров: ${imported}`);
    console.log(`Пропущено: ${skipped}`);
    console.log(`Всего обработано: ${extendedExcelData.length}`);

    return {
      imported,
      skipped,
      total: extendedExcelData.length
    };

  } catch (error) {
    console.error('Критическая ошибка при расширенном импорте:', error);
    throw error;
  }
}

// Запускаем расширенный импорт
importExtendedExcelData()
  .then(result => {
    console.log('\n✅ Расширенный импорт завершен успешно!');
    console.log('Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Ошибка расширенного импорта:', error);
    process.exit(1);
  });