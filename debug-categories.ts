
import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function debugCategories() {
  console.log('=== ДИАГНОСТИКА КАТЕГОРИЙ И ТОВАРОВ ===\n');

  // Проверяем общее количество товаров
  const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
  console.log(`Общее количество товаров: ${totalProducts[0].count}`);

  // Проверяем количество активных товаров
  const activeProducts = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
  console.log(`Активных товаров: ${activeProducts[0].count}`);

  // Проверяем товары с тегом 'tss'
  const tssProducts = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.tag, 'tss'));
  console.log(`Товаров с тегом 'tss': ${tssProducts[0].count}`);

  // Проверяем распределение товаров по категориям
  const productsByCategory = await db
    .select({
      categoryId: products.categoryId,
      categoryName: categories.name,
      productCount: sql<number>`count(*)`
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .groupBy(products.categoryId, categories.name)
    .orderBy(sql<number>`count(*) desc`);

  console.log('\n=== ТОВАРЫ ПО КАТЕГОРИЯМ ===');
  productsByCategory.forEach(item => {
    console.log(`${item.categoryName || 'Без категории'} (ID: ${item.categoryId}): ${item.productCount} товаров`);
  });

  // Проверяем категории без товаров
  const emptyCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      isActive: categories.isActive
    })
    .from(categories)
    .where(eq(categories.isActive, true));

  console.log('\n=== ВСЕ АКТИВНЫЕ КАТЕГОРИИ ===');
  for (const category of emptyCategories) {
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, category.id));
    
    console.log(`${category.name} (ID: ${category.id}): ${productCount[0].count} товаров`);
  }

  // Проверяем товары без категорий
  const orphanProducts = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.categoryId} IS NULL OR ${products.categoryId} NOT IN (SELECT id FROM categories WHERE is_active = true)`);

  console.log(`\nТоваров без категории или с неактивной категорией: ${orphanProducts[0].count}`);

  process.exit(0);
}

debugCategories().catch(console.error);
