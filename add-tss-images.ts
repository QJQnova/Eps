import fs from 'fs';
import path from 'path';
import { pool } from './server/db';
import { parse } from 'csv-parse/sync';

interface TSSProduct {
  id: string;
  description: string;
  name: string;
  price: string;
  currencyId: string;
  categoryId: string;
  picture: string;
  url: string;
}

function getFirstImageUrl(pictureField: string): string {
  if (!pictureField || pictureField.trim() === '') return '';
  
  const urls = pictureField.split(',').map(url => url.trim());
  const firstUrl = urls[0];
  
  if (firstUrl && (firstUrl.startsWith('http://') || firstUrl.startsWith('https://'))) {
    return firstUrl;
  }
  
  return '';
}

async function addTSSImages() {
  console.log('🖼️ Добавляем картинки к TSS товарам...');
  
  const client = await pool.connect();
  
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'products (2)_1752679653734.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records: TSSProduct[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`📊 Обрабатываем ${records.length} товаров для добавления картинок`);
    
    let updatedCount = 0;
    let withImagesCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      if (!record.id || !record.picture) continue;
      
      const imageUrl = getFirstImageUrl(record.picture);
      
      if (imageUrl) {
        try {
          await client.query(
            'UPDATE products SET image_url = $1 WHERE sku = $2 AND tag = $3',
            [imageUrl, record.id, 'tss']
          );
          
          updatedCount++;
          withImagesCount++;
          
          if (updatedCount % 100 === 0) {
            console.log(`✅ Обновлено картинок: ${updatedCount}`);
          }
          
        } catch (error) {
          console.error(`❌ Ошибка обновления товара ${record.id}:`, error);
        }
      }
    }
    
    console.log(`\n🎉 ДОБАВЛЕНИЕ КАРТИНОК ЗАВЕРШЕНО!`);
    console.log(`✅ Обработано товаров: ${updatedCount}`);
    console.log(`📸 Товаров с картинками: ${withImagesCount}`);
    
    // Проверяем результат
    const result = await client.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN image_url IS NOT NULL AND image_url != \'\' THEN 1 END) as with_images FROM products WHERE tag = $1',
      ['tss']
    );
    
    console.log(`📊 Итоговая статистика:`);
    console.log(`   Всего TSS товаров: ${result.rows[0].total}`);
    console.log(`   С картинками: ${result.rows[0].with_images}`);
    
  } catch (error) {
    console.error('💥 Ошибка:', error);
  } finally {
    client.release();
  }
}

addTSSImages()
  .then(() => {
    console.log('🏁 Добавление картинок завершено');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });