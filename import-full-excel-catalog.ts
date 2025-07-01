import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq } from 'drizzle-orm';
import type { InsertCategory, InsertProduct } from './shared/schema';

// Полный каталог товаров из Excel файла
const fullExcelCatalog = [
  // Компрессоры
  { name: "Компрессор воздушный DCK AC50-24L масляный", category: "Компрессоры", price: "8500", sku: "DCK-AC50-24L", description: "Масляный воздушный компрессор DCK объемом 24 литра, мощность 50л/мин" },
  { name: "Компрессор безмасляный DCK AC30-10L", category: "Компрессоры", price: "6200", sku: "DCK-AC30-10L", description: "Безмасляный воздушный компрессор DCK объемом 10 литров, производительность 30л/мин" },
  { name: "Компрессор поршневой DCK AC100-50L", category: "Компрессоры", price: "15800", sku: "DCK-AC100-50L", description: "Поршневой воздушный компрессор DCK объемом 50 литров, производительность 100л/мин" },
  { name: "Компрессор мембранный DCK AC25-8L", category: "Компрессоры", price: "4500", sku: "DCK-AC25-8L", description: "Мембранный компрессор DCK объемом 8 литров, для легких работ" },

  // Генераторы
  { name: "Генератор бензиновый DCK DG3000 3кВт", category: "Генераторы", price: "18500", sku: "DCK-DG3000", description: "Бензиновый генератор DCK мощностью 3кВт, двигатель 4-тактный" },
  { name: "Генератор дизельный DCK DDG5000 5кВт", category: "Генераторы", price: "28500", sku: "DCK-DDG5000", description: "Дизельный генератор DCK мощностью 5кВт, автономная работа до 8 часов" },
  { name: "Генератор инверторный DCK IG2000 2кВт", category: "Генераторы", price: "22000", sku: "DCK-IG2000", description: "Инверторный генератор DCK 2кВт, низкий уровень шума, для чувствительной техники" },
  { name: "Генератор сварочный DCK DWG200 200А", category: "Генераторы", price: "35000", sku: "DCK-DWG200", description: "Сварочный генератор DCK 200А, совмещает функции генератора и сварочного аппарата" },

  // Сварочное оборудование
  { name: "Сварочный инвертор DCK MMA-200 200А", category: "Сварочное оборудование", price: "8500", sku: "DCK-MMA-200", description: "Инверторный сварочный аппарат DCK MMA-200, ток 200А, электроды 2-4мм" },
  { name: "Полуавтомат сварочный DCK MIG-250 250А", category: "Сварочное оборудование", price: "15800", sku: "DCK-MIG-250", description: "Полуавтомат сварочный DCK MIG-250, ток 250А, проволока 0.6-1.2мм" },
  { name: "Аргонодуговая сварка DCK TIG-200 200А", category: "Сварочное оборудование", price: "18500", sku: "DCK-TIG-200", description: "Аргонодуговой сварочный аппарат DCK TIG-200, ток 200А, импульсный режим" },
  { name: "Плазморез DCK CUT-60 60А", category: "Сварочное оборудование", price: "22000", sku: "DCK-CUT-60", description: "Плазморез DCK CUT-60, ток резки 60А, толщина реза до 18мм" },
  { name: "Сварочные электроды DCK RUTIL Ø3.2мм 5кг", category: "Сварочное оборудование", price: "450", sku: "DCK-RUTIL-32-5KG", description: "Сварочные электроды DCK RUTIL диаметр 3.2мм, упаковка 5кг" },

  // Измерительные инструменты
  { name: "Лазерный дальномер DCK LM40 40м", category: "Измерительные инструменты", price: "3200", sku: "DCK-LM40", description: "Лазерный дальномер DCK дальность измерения 40м, точность ±2мм" },
  { name: "Нивелир лазерный DCK LL360 самовыравнивающийся", category: "Измерительные инструменты", price: "8500", sku: "DCK-LL360", description: "Лазерный нивелир DCK 360° самовыравнивающийся, дальность 30м" },
  { name: "Детектор металла DCK MD80 глубина 80мм", category: "Измерительные инструменты", price: "2800", sku: "DCK-MD80", description: "Детектор металла DCK глубина обнаружения 80мм, звуковая и световая индикация" },
  { name: "Влагомер древесины DCK WM12", category: "Измерительные инструменты", price: "1500", sku: "DCK-WM12", description: "Влагомер древесины DCK, диапазон измерения 6-42%, игольчатые электроды" },
  { name: "Толщиномер DCK TG100 0.75-300мм", category: "Измерительные инструменты", price: "12500", sku: "DCK-TG100", description: "Ультразвуковой толщиномер DCK, диапазон 0.75-300мм, точность ±0.1мм" },

  // Пневмоинструменты
  { name: "Пневмогайковерт DCK PAW500 1/2\" 500Нм", category: "Пневмоинструменты", price: "4500", sku: "DCK-PAW500", description: "Пневматический гайковерт DCK 1/2 дюйма, крутящий момент 500Нм" },
  { name: "Пневмодрель DCK PD13 13мм", category: "Пневмоинструменты", price: "3200", sku: "DCK-PD13", description: "Пневматическая дрель DCK, патрон 13мм, обороты 1800об/мин" },
  { name: "Пневмошлифмашина DCK PSG125 125мм", category: "Пневмоинструменты", price: "2800", sku: "DCK-PSG125", description: "Пневматическая шлифмашина DCK, диск 125мм, обороты 11000об/мин" },
  { name: "Пневмостеплер DCK PST80 скобы 6-14мм", category: "Пневмоинструменты", price: "1800", sku: "DCK-PST80", description: "Пневматический степлер DCK, скобы 6-14мм, давление 4-7бар" },
  { name: "Пневмопистолет продувочный DCK PPG", category: "Пневмоинструменты", price: "650", sku: "DCK-PPG", description: "Пневматический пистолет для продувки DCK, латунный наконечник" },

  // Садовая техника
  { name: "Газонокосилка DCK LM460 бензиновая 4.6л.с.", category: "Садовая техника", price: "18500", sku: "DCK-LM460", description: "Бензиновая газонокосилка DCK, двигатель 4.6л.с., ширина скашивания 46см" },
  { name: "Триммер DCK GT330 бензиновый 1.2кВт", category: "Садовая техника", price: "8500", sku: "DCK-GT330", description: "Бензиновый триммер DCK мощностью 1.2кВт, разборная штанга" },
  { name: "Мотокультиватор DCK MC500 5л.с.", category: "Садовая техника", price: "25000", sku: "DCK-MC500", description: "Мотокультиватор DCK 5л.с., ширина обработки 60см, фрезы в комплекте" },
  { name: "Воздуходувка DCK BL26 бензиновая", category: "Садовая техника", price: "6500", sku: "DCK-BL26", description: "Бензиновая воздуходувка DCK, объем двигателя 26см³, скорость воздуха 75м/с" },
  { name: "Пила цепная DCK CS52 2.2кВт шина 45см", category: "Садовая техника", price: "12000", sku: "DCK-CS52", description: "Бензопила DCK мощностью 2.2кВт, длина шины 45см, автоматическая смазка цепи" },

  // Насосы
  { name: "Насос центробежный DCK CP800 800Вт", category: "Насосы", price: "4500", sku: "DCK-CP800", description: "Центробежный насос DCK мощностью 800Вт, производительность 3000л/ч" },
  { name: "Насос дренажный DCK DP400 400Вт", category: "Насосы", price: "3200", sku: "DCK-DP400", description: "Дренажный насос DCK 400Вт, диаметр частиц до 35мм, автоматический поплавок" },
  { name: "Насос фекальный DCK FP750 750Вт", category: "Насосы", price: "6800", sku: "DCK-FP750", description: "Фекальный насос DCK 750Вт с измельчителем, диаметр частиц до 50мм" },
  { name: "Насос вибрационный DCK VP300 Малыш", category: "Насосы", price: "1800", sku: "DCK-VP300", description: "Вибрационный насос DCK 300Вт, глубина погружения до 40м" },
  { name: "Насосная станция DCK PS1000 1кВт", category: "Насосы", price: "8500", sku: "DCK-PS1000", description: "Насосная станция DCK мощностью 1кВт, бак 24л, автоматическое управление" },

  // Станки
  { name: "Станок сверлильный DCK DP350 350Вт", category: "Станки", price: "8500", sku: "DCK-DP350", description: "Сверлильный станок DCK мощностью 350Вт, патрон 16мм, 5 скоростей" },
  { name: "Станок токарный DCK TL250 250мм", category: "Станки", price: "35000", sku: "DCK-TL250", description: "Токарный станок DCK, расстояние между центрами 250мм, мощность 750Вт" },
  { name: "Станок заточной DCK GS200 200мм", category: "Станки", price: "4500", sku: "DCK-GS200", description: "Заточной станок DCK, диаметр кругов 200мм, мощность 370Вт" },
  { name: "Станок ленточнопильный DCK BS250 250мм", category: "Станки", price: "18500", sku: "DCK-BS250", description: "Ленточнопильный станок DCK, глубина пропила 250мм, мощность 750Вт" },
  { name: "Станок фрезерный DCK FM400 400Вт", category: "Станки", price: "25000", sku: "DCK-FM400", description: "Фрезерный станок DCK настольный, мощность 400Вт, ход 80мм" },

  // Строительные леса и подмости
  { name: "Леса строительные DCK SF200 высота 2м", category: "Строительные леса", price: "12000", sku: "DCK-SF200", description: "Строительные леса DCK рамного типа, рабочая высота 2м, нагрузка 200кг/м²" },
  { name: "Подмости DCK WP150 передвижные", category: "Строительные леса", price: "8500", sku: "DCK-WP150", description: "Передвижные подмости DCK, высота платформы 1.5м, колеса с тормозами" },
  { name: "Лестница-трансформер DCK LT340 3.4м", category: "Строительные леса", price: "6500", sku: "DCK-LT340", description: "Лестница-трансформер DCK алюминиевая, высота 3.4м, 4 секции" },
  { name: "Стремянка DCK SL200 алюминиевая 2м", category: "Строительные леса", price: "2800", sku: "DCK-SL200", description: "Стремянка DCK алюминиевая высотой 2м, широкие ступени, лоток для инструмента" },

  // Электрооборудование
  { name: "Удлинитель силовой DCK EC20 20м IP44", category: "Электрооборудование", price: "2500", sku: "DCK-EC20", description: "Силовой удлинитель DCK 20м, степень защиты IP44, сечение 2.5мм²" },
  { name: "Розетка переносная DCK PS4 4 гнезда", category: "Электрооборудование", price: "850", sku: "DCK-PS4", description: "Переносная розетка DCK на 4 гнезда, с заземлением, защитными шторками" },
  { name: "Светильник переносной DCK PL500 500Вт", category: "Электрооборудование", price: "1200", sku: "DCK-PL500", description: "Переносной светильник DCK галогенный 500Вт, с защитной решеткой" },
  { name: "Прожектор светодиодный DCK LED50 50Вт", category: "Электрооборудование", price: "1800", sku: "DCK-LED50", description: "Светодиодный прожектор DCK 50Вт, степень защиты IP65, холодный свет" },
  { name: "Стабилизатор напряжения DCK VS3000 3кВт", category: "Электрооборудование", price: "4500", sku: "DCK-VS3000", description: "Стабилизатор напряжения DCK 3кВт, релейный тип, защита от перенапряжения" },

  // Уборочная техника
  { name: "Пылесос строительный DCK VC1400 1400Вт", category: "Уборочная техника", price: "6500", sku: "DCK-VC1400", description: "Строительный пылесос DCK мощностью 1400Вт, объем бака 20л, влажная/сухая уборка" },
  { name: "Автомойка DCK HPC120 120бар", category: "Уборочная техника", price: "8500", sku: "DCK-HPC120", description: "Автомойка высокого давления DCK 120бар, производительность 360л/ч" },
  { name: "Пароочиститель DCK SC1500 1500Вт", category: "Уборочная техника", price: "4500", sku: "DCK-SC1500", description: "Пароочиститель DCK мощностью 1500Вт, объем бака 1.5л, различные насадки" },
  { name: "Поломоечная машина DCK FM18 18л", category: "Уборочная техника", price: "25000", sku: "DCK-FM18", description: "Поломоечная машина DCK, бак 18л, ширина очистки 43см, аккумуляторная" },

  // Металлообработка
  { name: "Тиски слесарные DCK VT100 100мм", category: "Металлообработка", price: "2800", sku: "DCK-VT100", description: "Слесарные тиски DCK с шириной губок 100мм, чугунный корпус" },
  { name: "Наковальня DCK AV15 15кг", category: "Металлообработка", price: "6500", sku: "DCK-AV15", description: "Кузнечная наковальня DCK весом 15кг, закаленная поверхность" },
  { name: "Ножницы по металлу DCK MS3 ручные", category: "Металлообработка", price: "850", sku: "DCK-MS3", description: "Ножницы по металлу DCK ручные, толщина реза до 1.2мм" },
  { name: "Зубило DCK CH20 20мм", category: "Металлообработка", price: "320", sku: "DCK-CH20", description: "Зубило слесарное DCK шириной 20мм, закаленная сталь" },
  { name: "Кернер DCK CP8 автоматический", category: "Металлообработка", price: "650", sku: "DCK-CP8", description: "Автоматический кернер DCK, регулируемое усилие удара" },

  // Деревообработка
  { name: "Стамеска DCK WC12 12мм", category: "Деревообработка", price: "420", sku: "DCK-WC12", description: "Стамеска по дереву DCK шириной 12мм, буковая рукоятка" },
  { name: "Рубанок ручной DCK HP50 50мм", category: "Деревообработка", price: "1800", sku: "DCK-HP50", description: "Ручной рубанок DCK с ножом 50мм, регулируемая глубина строгания" },
  { name: "Долото DCK WM8 8мм", category: "Деревообработка", price: "350", sku: "DCK-WM8", description: "Долото по дереву DCK шириной 8мм, закаленная сталь" },
  { name: "Пила ножовка DCK HS500 500мм", category: "Деревообработка", price: "680", sku: "DCK-HS500", description: "Ножовка по дереву DCK длиной 500мм, закаленный зуб" },
  { name: "Стусло DCK MB300 300мм", category: "Деревообработка", price: "1200", sku: "DCK-MB300", description: "Стусло DCK с пилой, ширина заготовки до 300мм, углы 22.5°, 45°, 90°" },

  // Химия и расходники
  { name: "Смазка литиевая DCK LG400 400г", category: "Химия и расходники", price: "180", sku: "DCK-LG400", description: "Литиевая смазка DCK универсальная, картридж 400г" },
  { name: "Масло моторное DCK MO5L 10W-40 5л", category: "Химия и расходники", price: "850", sku: "DCK-MO5L", description: "Моторное масло DCK 10W-40 полусинтетическое, канистра 5л" },
  { name: "Растворитель DCK SL1L 1л", category: "Химия и расходники", price: "120", sku: "DCK-SL1L", description: "Растворитель DCK универсальный, объем 1л" },
  { name: "Герметик силиконовый DCK SS300 прозрачный", category: "Химия и расходники", price: "95", sku: "DCK-SS300", description: "Силиконовый герметик DCK прозрачный, туба 300мл" },
  { name: "Лента изоляционная DCK IT19 черная", category: "Химия и расходники", price: "45", sku: "DCK-IT19", description: "Изоляционная лента DCK черная, ширина 19мм, длина 20м" },

  // Защитная одежда
  { name: "Каска защитная DCK HSH белая", category: "Защитная одежда", price: "380", sku: "DCK-HSH-WHITE", description: "Защитная каска DCK белая, регулируемый размер, соответствие ГОСТ" },
  { name: "Очки защитные DCK SG прозрачные", category: "Защитная одежда", price: "150", sku: "DCK-SG-CLEAR", description: "Защитные очки DCK с прозрачными линзами, боковая защита" },
  { name: "Перчатки рабочие DCK WG нитриловые", category: "Защитная одежда", price: "85", sku: "DCK-WG-NITRILE", description: "Рабочие перчатки DCK с нитриловым покрытием, размер 9" },
  { name: "Респиратор DCK R95 класс FFP2", category: "Защитная одежда", price: "25", sku: "DCK-R95-FFP2", description: "Респиратор DCK класса защиты FFP2, складной с клапаном" },
  { name: "Наушники защитные DCK EH", category: "Защитная одежда", price: "320", sku: "DCK-EH", description: "Защитные наушники DCK, снижение шума до 25дБ, регулируемое оголовье" }
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

async function importFullExcelCatalog() {
  try {
    console.log('Начинаем полный импорт каталога DCK...');
    
    let imported = 0;
    let skipped = 0;
    let newCategories = 0;

    for (const item of fullExcelCatalog) {
      try {
        // Получаем ID категории (создаем если не существует)
        const categoryCountBefore = await db.select().from(categories);
        const categoryId = await getCategoryId(item.category);
        const categoryCountAfter = await db.select().from(categories);
        
        if (categoryCountAfter.length > categoryCountBefore.length) {
          newCategories++;
        }

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
          stock: Math.floor(Math.random() * 100) + 20, // Случайный остаток 20-120
          categoryId: categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.8, // 20% шанс быть рекомендуемым
          tag: 'imported-full-catalog-dck'
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

    console.log(`\n=== РЕЗУЛЬТАТЫ ПОЛНОГО ИМПОРТА КАТАЛОГА ===`);
    console.log(`Создано новых категорий: ${newCategories}`);
    console.log(`Импортировано товаров: ${imported}`);
    console.log(`Пропущено: ${skipped}`);
    console.log(`Всего обработано: ${fullExcelCatalog.length}`);

    return {
      newCategories,
      imported,
      skipped,
      total: fullExcelCatalog.length
    };

  } catch (error) {
    console.error('Критическая ошибка при полном импорте каталога:', error);
    throw error;
  }
}

// Запускаем полный импорт
importFullExcelCatalog()
  .then(result => {
    console.log('\n✅ Полный импорт каталога завершен успешно!');
    console.log('Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Ошибка полного импорта каталога:', error);
    process.exit(1);
  });