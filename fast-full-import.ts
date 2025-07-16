import fs from 'fs';
import path from 'path';
import { pool } from './server/db';
import { parse } from 'csv-parse/sync';

async function fastFullImport() {
  console.log('🚀 БЫСТРЫЙ ИМПОРТ ВСЕХ 2586 TSS ТОВАРОВ');
  
  const client = await pool.connect();
  
  try {
    // Удаляем все TSS товары
    await client.query('DELETE FROM products WHERE tag = $1', ['tss']);
    
    const csvPath = path.join(process.cwd(), 'attached_assets', 'products (2)_1752679653734.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`Обрабатываем ${records.length} товаров`);
    
    // Получаем существующие категории
    const categoryResult = await client.query('SELECT id, name FROM categories');
    const categories = new Map(categoryResult.rows.map(row => [row.name, row.id]));
    
    // Создаем базовые категории если их нет
    const baseCategories = ['Генераторы', 'Компрессоры', 'Сварочное оборудование', 'Промышленное оборудование'];
    
    for (const catName of baseCategories) {
      if (!categories.has(catName)) {
        const result = await client.query(
          'INSERT INTO categories (name, slug, description, icon) VALUES ($1, $2, $3, $4) RETURNING id',
          [catName, catName.toLowerCase().replace(/\s+/g, '-'), `Категория ${catName}`, 'settings']
        );
        categories.set(catName, result.rows[0].id);
      }
    }
    
    // Подготавливаем все товары
    const products = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      if (!record.name || !record.name.trim()) continue;
      
      const name = record.name.trim().replace(/\s+/g, ' ');
      const description = (record.description || name).trim().replace(/\s+/g, ' ');
      const price = parseFloat(record.price) || 0;
      
      // Простая категоризация
      let categoryName = 'Промышленное оборудование';
      if (name.toLowerCase().includes('генератор')) categoryName = 'Генераторы';
      else if (name.toLowerCase().includes('компрессор')) categoryName = 'Компрессоры';
      else if (name.toLowerCase().includes('сварочный') || name.toLowerCase().includes('сварка')) categoryName = 'Сварочное оборудование';
      
      const categoryId = categories.get(categoryName);
      
      products.push([
        name,                                    // name
        record.id || `TSS-${i}`,               // sku
        `tss-product-${i}`,                    // slug (уникальный)
        description,                           // description
        description.substring(0, 150),        // short_description
        price,                                 // price
        null,                                  // original_price
        '',                                    // image_url
        categoryId,                           // category_id
        null,                                 // stock
        true,                                 // is_active
        false,                                // is_featured
        'tss'                                 // tag
      ]);
    }
    
    console.log(`Готово к импорту: ${products.length} товаров`);
    
    // Массовая вставка большими блоками
    const batchSize = 500;
    let imported = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const values = batch.flat();
      const placeholders = batch.map((_, index) => {
        const base = index * 13;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`;
      }).join(', ');
      
      const query = `
        INSERT INTO products (
          name, sku, slug, description, short_description, price,
          original_price, image_url, category_id, stock, is_active, is_featured, tag
        ) VALUES ${placeholders}
      `;
      
      try {
        await client.query(query, values);
        imported += batch.length;
        console.log(`✅ Импортировано: ${imported}/${products.length}`);
      } catch (error) {
        console.error(`❌ Ошибка блока ${i}:`, error.message);
      }
    }
    
    console.log(`\n🎉 ИМПОРТ ЗАВЕРШЕН: ${imported} товаров`);
    
  } catch (error) {
    console.error('💥 Ошибка:', error);
  } finally {
    client.release();
  }
}

fastFullImport().then(() => process.exit(0)).catch(console.error);