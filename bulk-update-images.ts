import fs from 'fs';
import path from 'path';
import { pool } from './server/db';
import { parse } from 'csv-parse/sync';

async function bulkUpdateImages() {
  console.log('🚀 МАССОВОЕ ОБНОВЛЕНИЕ КАРТИНОК TSS');
  
  const client = await pool.connect();
  
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'products (2)_1752679653734.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`Обрабатываем ${records.length} товаров`);
    
    // Массовое обновление через CASE WHEN
    const updateCases = [];
    const skuList = [];
    
    for (const record of records) {
      if (!record.id || !record.picture) continue;
      
      const imageUrl = record.picture.split(',')[0].trim();
      if (imageUrl && imageUrl.startsWith('http')) {
        updateCases.push(`WHEN sku = '${record.id}' THEN '${imageUrl}'`);
        skuList.push(`'${record.id}'`);
      }
    }
    
    if (updateCases.length > 0) {
      const query = `
        UPDATE products 
        SET image_url = CASE 
          ${updateCases.join(' ')}
          ELSE image_url 
        END
        WHERE tag = 'tss' AND sku IN (${skuList.join(',')})
      `;
      
      await client.query(query);
      console.log(`✅ Обновлено ${updateCases.length} товаров`);
    }
    
    // Проверяем результат
    const result = await client.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN image_url IS NOT NULL AND image_url != \'\' THEN 1 END) as with_images FROM products WHERE tag = \'tss\''
    );
    
    console.log(`📊 Итог: ${result.rows[0].with_images}/${result.rows[0].total} товаров с картинками`);
    
  } catch (error) {
    console.error('💥 Ошибка:', error);
  } finally {
    client.release();
  }
}

bulkUpdateImages().then(() => process.exit(0)).catch(console.error);