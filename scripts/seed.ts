// Скрипт для заполнения базы данных тестовыми данными
import { db } from '../server/db';
import { categories, products } from '../shared/schema';
import { eq, count } from 'drizzle-orm';

async function seedDatabase() {
  console.log('Начинаем заполнение базы данных...');

  // Очищаем существующие данные
  console.log('Очистка старых данных...');
  try {
    await db.delete(products);
    await db.delete(categories);
    console.log('Данные успешно очищены');
  } catch (error) {
    console.error('Ошибка при очистке данных:', error);
  }

  // Добавляем категории
  console.log('Добавление категорий...');
  const categoriesData = [
    { name: 'Электроинструменты', slug: 'power-tools', description: 'Профессиональные электроинструменты для любых задач', icon: 'drill' },
    { name: 'Ручные инструменты', slug: 'hand-tools', description: 'Надежные ручные инструменты для мастеров', icon: 'hammer' },
    { name: 'Измерительные инструменты', slug: 'measuring-tools', description: 'Точные измерительные инструменты для профессионалов', icon: 'ruler' },
    { name: 'Сварочное оборудование', slug: 'welding-equipment', description: 'Оборудование для сварочных работ всех типов', icon: 'sparkles' },
    { name: 'Строительное оборудование', slug: 'construction-equipment', description: 'Надежная техника для строительных работ', icon: 'construction' },
  ];

  const insertedCategories = [];
  for (const category of categoriesData) {
    try {
      const [inserted] = await db.insert(categories)
        .values(category)
        .returning();
      console.log(`Добавлена категория: ${category.name}`);
      insertedCategories.push(inserted);
    } catch (error) {
      console.error(`Ошибка при добавлении категории ${category.name}:`, error);
    }
  }

  // Добавляем товары
  console.log('Добавление товаров...');
  const productsData = [
    // Электроинструменты (categoryId = 1)
    {
      sku: 'PT001',
      name: 'Дрель ударная ЭПС-950',
      slug: 'drill-eps-950',
      description: 'Мощная ударная дрель для работы с различными материалами. Мощность 950 Вт.',
      shortDescription: 'Ударная дрель 950 Вт',
      price: '4990',
      originalPrice: '5490',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-950',
      stock: 25,
      categoryId: 1,
      isActive: true,
      isFeatured: true
    },
    {
      sku: 'PT002',
      name: 'Перфоратор ЭПС-1200',
      slug: 'hammer-drill-eps-1200',
      description: 'Профессиональный перфоратор с тремя режимами работы. Мощность 1200 Вт.',
      shortDescription: 'Перфоратор 1200 Вт',
      price: '8990',
      originalPrice: '9990',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-1200',
      stock: 15,
      categoryId: 1,
      isActive: true,
      isFeatured: true
    },
    {
      sku: 'PT003',
      name: 'Шуруповерт аккумуляторный ЭПС-18V',
      slug: 'cordless-drill-eps-18v',
      description: 'Аккумуляторный шуруповерт с литий-ионным аккумулятором 18V.',
      shortDescription: 'Шуруповерт 18V',
      price: '5490',
      originalPrice: '6290',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-18V',
      stock: 30,
      categoryId: 1,
      isActive: true,
      isFeatured: false
    },

    // Ручные инструменты (categoryId = 2)
    {
      sku: 'HT001',
      name: 'Набор отверток ЭПС-24',
      slug: 'screwdriver-set-eps-24',
      description: 'Набор из 24 отверток с различными наконечниками и размерами.',
      shortDescription: 'Набор отверток 24 шт.',
      price: '1990',
      originalPrice: '2490',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-24',
      stock: 50,
      categoryId: 2,
      isActive: true,
      isFeatured: true
    },
    {
      sku: 'HT002',
      name: 'Молоток слесарный ЭПС-500',
      slug: 'hammer-eps-500',
      description: 'Слесарный молоток весом 500 грамм с эргономичной рукояткой.',
      shortDescription: 'Молоток 500 г',
      price: '890',
      originalPrice: '999',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-500',
      stock: 75,
      categoryId: 2,
      isActive: true,
      isFeatured: false
    },

    // Измерительные инструменты (categoryId = 3)
    {
      sku: 'MT001',
      name: 'Лазерный уровень ЭПС-LL50',
      slug: 'laser-level-eps-ll50',
      description: 'Профессиональный лазерный уровень с дальностью до 50 метров.',
      shortDescription: 'Лазерный уровень 50м',
      price: '7990',
      originalPrice: '8990',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-LL50',
      stock: 10,
      categoryId: 3,
      isActive: true,
      isFeatured: true
    },
    {
      sku: 'MT002',
      name: 'Рулетка ЭПС-5м',
      slug: 'measuring-tape-eps-5m',
      description: 'Компактная рулетка длиной 5 метров с фиксатором и магнитным крючком.',
      shortDescription: 'Рулетка 5м',
      price: '490',
      originalPrice: '590',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-5м',
      stock: 100,
      categoryId: 3,
      isActive: true,
      isFeatured: false
    },

    // Сварочное оборудование (categoryId = 4)
    {
      sku: 'WE001',
      name: 'Сварочный инвертор ЭПС-200',
      slug: 'welding-inverter-eps-200',
      description: 'Профессиональный сварочный инвертор для электродуговой сварки. Сила тока до 200А.',
      shortDescription: 'Сварочный инвертор 200A',
      price: '12990',
      originalPrice: '14990',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-200',
      stock: 8,
      categoryId: 4,
      isActive: true,
      isFeatured: true
    },

    // Строительное оборудование (categoryId = 5)
    {
      sku: 'CE001',
      name: 'Бетономешалка ЭПС-160',
      slug: 'concrete-mixer-eps-160',
      description: 'Надежная бетономешалка объемом 160 литров для строительных работ.',
      shortDescription: 'Бетономешалка 160л',
      price: '19990',
      originalPrice: '21990',
      imageUrl: 'https://placehold.co/600x400?text=ЭПС-160',
      stock: 5,
      categoryId: 5,
      isActive: true,
      isFeatured: true
    }
  ];

  for (const product of productsData) {
    try {
      const [inserted] = await db.insert(products)
        .values(product)
        .returning();
      console.log(`Добавлен товар: ${product.name}`);
    } catch (error) {
      console.error(`Ошибка при добавлении товара ${product.name}:`, error);
    }
  }

  // Обновляем счетчики в категориях
  console.log('Обновление счетчиков товаров в категориях...');
  for (const category of insertedCategories) {
    try {
      const productCount = await db.select({ count: count() })
        .from(products)
        .where(eq(products.categoryId, category.id));
      
      await db.update(categories)
        .set({ productCount: productCount[0].count || 0 })
        .where(eq(categories.id, category.id));
      
      console.log(`Обновлена категория ${category.name}: ${productCount[0].count || 0} товаров`);
    } catch (error) {
      console.error(`Ошибка при обновлении счетчика для категории ${category.name}:`, error);
    }
  }

  console.log('Заполнение базы данных завершено!');
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('Ошибка при заполнении базы данных:', err);
  process.exit(1);
});