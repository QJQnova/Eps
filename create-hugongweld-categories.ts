import { db } from './server/db';
import { categories, products } from './shared/schema';
import { eq, sql } from 'drizzle-orm';
import type { InsertCategory } from './shared/schema';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || `category-${Date.now()}`;
}

async function createCategoryIfNotExists(categoryName: string, description?: string, icon?: string): Promise<number> {
  const cleanName = categoryName.trim();
  
  // Проверяем существующую категорию
  const existing = await db.select()
    .from(categories)
    .where(eq(categories.name, cleanName))
    .limit(1);

  if (existing.length > 0) {
    console.log(`✓ Категория "${cleanName}" уже существует (ID: ${existing[0].id})`);
    return existing[0].id;
  }

  // Создаем новую категорию
  const slug = generateSlug(cleanName);
  
  const categoryData: InsertCategory = {
    name: cleanName,
    slug: slug,
    description: description || `Категория ${cleanName} для сварочного оборудования HUGONGWELD`,
    icon: icon || 'tool'
  };

  const [newCategory] = await db.insert(categories)
    .values(categoryData)
    .returning();

  console.log(`✅ Создана категория: ${cleanName} (ID: ${newCategory.id})`);
  return newCategory.id;
}

async function createHugongweldCategories() {
  console.log('🔧 Создание категорий для сварочного оборудования HUGONGWELD...\n');
  
  try {
    // Создаем основные категории для сварочного оборудования
    const categoriesToCreate = [
      {
        name: 'Сварочные инверторы',
        description: 'Инверторные сварочные аппараты HUGONGWELD для ручной дуговой сварки',
        icon: 'zap'
      },
      {
        name: 'Сварочные полуавтоматы', 
        description: 'Полуавтоматические сварочные аппараты HUGONGWELD MIG/MAG',
        icon: 'settings'
      },
      {
        name: 'Аргонодуговая сварка',
        description: 'Аппараты для аргонодуговой сварки TIG HUGONGWELD',
        icon: 'activity'
      },
      {
        name: 'Плазменная резка',
        description: 'Аппараты воздушно-плазменной резки HUGONGWELD',
        icon: 'scissors'
      },
      {
        name: 'Сварочные горелки',
        description: 'Горелки и расходные материалы для сварки HUGONGWELD',
        icon: 'flame'
      },
      {
        name: 'Сварочные материалы',
        description: 'Электроды, проволока и флюсы HUGONGWELD',
        icon: 'package'
      },
      {
        name: 'Защитное оборудование',
        description: 'Маски, перчатки и защитная одежда для сварки',
        icon: 'shield'
      },
      {
        name: 'Газовое оборудование',
        description: 'Редукторы, ротаметры и газовые смеси',
        icon: 'circle'
      },
      {
        name: 'Сварочное оборудование',
        description: 'Прочее сварочное оборудование и аксессуары HUGONGWELD',
        icon: 'tool'
      }
    ];

    const createdCategories: Record<string, number> = {};
    let createdCount = 0;

    for (const categoryData of categoriesToCreate) {
      try {
        const categoryId = await createCategoryIfNotExists(
          categoryData.name, 
          categoryData.description, 
          categoryData.icon
        );
        createdCategories[categoryData.name] = categoryId;
        createdCount++;
      } catch (error) {
        console.error(`❌ Ошибка создания категории "${categoryData.name}":`, error);
      }
    }

    console.log(`\n📊 Создано/найдено категорий: ${createdCount}`);
    
    // Проверяем товары HUGONGWELD и переназначаем их в правильные категории
    console.log('\n🔄 Обновление категорий для товаров HUGONGWELD...');
    
    const hugongweldProducts = await db.select().from(products).where(eq(products.tag, 'HUGONGWELD'));
    console.log(`📦 Найдено товаров HUGONGWELD: ${hugongweldProducts.length}`);
    
    let updatedCount = 0;

    for (const product of hugongweldProducts) {
      try {
        let newCategoryId: number | null = null;
        const productName = product.name.toLowerCase();
        
        // Определяем правильную категорию по названию товара
        if (productName.includes('инвертор') && productName.includes('сварочный')) {
          newCategoryId = createdCategories['Сварочные инверторы'];
        } else if (productName.includes('полуавтомат')) {
          newCategoryId = createdCategories['Сварочные полуавтоматы'];
        } else if (productName.includes('аргонодуговой') || productName.includes('tig') || productName.includes('etig') || productName.includes('protig')) {
          newCategoryId = createdCategories['Аргонодуговая сварка'];
        } else if (productName.includes('плазменной') || productName.includes('плазморез') || productName.includes('invercut') || productName.includes('powercut')) {
          newCategoryId = createdCategories['Плазменная резка'];
        } else if (productName.includes('многофункциональный') || productName.includes('3 в 1')) {
          newCategoryId = createdCategories['Сварочное оборудование'];
        } else if (productName.includes('трактор')) {
          newCategoryId = createdCategories['Сварочное оборудование'];
        } else {
          // Если не удалось определить точную категорию, ставим общую
          newCategoryId = createdCategories['Сварочное оборудование'];
        }

        if (newCategoryId && newCategoryId !== product.categoryId) {
          await db.update(products)
            .set({ categoryId: newCategoryId })
            .where(eq(products.id, product.id));
          
          updatedCount++;
          console.log(`✓ Товар "${product.name}" перемещен в правильную категорию`);
        }
      } catch (error) {
        console.error(`❌ Ошибка обновления товара "${product.name}":`, error);
      }
    }

    console.log(`\n📈 Обновлено товаров: ${updatedCount}`);

    // Обновляем счетчики товаров в категориях
    await db.execute(sql`
      UPDATE ${categories} 
      SET product_count = (
        SELECT COUNT(*) 
        FROM ${products} 
        WHERE ${products.categoryId} = ${categories.id} 
        AND ${products.isActive} = true
      )
    `);

    console.log('✅ Счетчики категорий обновлены');

    // Выводим итоговую статистику
    console.log('\n📊 Итоговая статистика категорий HUGONGWELD:');
    for (const [categoryName, categoryId] of Object.entries(createdCategories)) {
      const productCount = await db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, categoryId))
        .where(eq(products.tag, 'HUGONGWELD'));
      
      const count = productCount[0]?.count || 0;
      if (count > 0) {
        console.log(`  - ${categoryName}: ${count} товаров`);
      }
    }

    console.log('\n🎉 Категории HUGONGWELD созданы и настроены успешно!');

  } catch (error) {
    console.error('💥 Критическая ошибка при создании категорий:', error);
    throw error;
  }
}

// Запускаем создание категорий
createHugongweldCategories()
  .then(() => {
    console.log('🚀 Процесс создания категорий HUGONGWELD завершен!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка при создании категорий HUGONGWELD:', error);
    process.exit(1);
  });