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

function generateUniqueSlug(text: string, index: number): string {
  const baseSlug = text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${baseSlug}-tss-${index}`;
}

function cleanText(text: any): string {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
}

function extractPrice(priceText: string): number {
  if (!priceText || priceText === '0') return 0;
  const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
  return isNaN(numericPrice) ? 0 : numericPrice;
}

function getCategoryFromName(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('генератор') || name.includes('generator')) return 'Генераторы';
  if (name.includes('двигатель') || name.includes('engine')) return 'Двигатели';
  if (name.includes('регулятор') || name.includes('avr')) return 'Регуляторы напряжения';
  if (name.includes('виброрейка') || name.includes('виброплита')) return 'Виброоборудование';
  if (name.includes('вибротрамбовка')) return 'Виброоборудование';
  if (name.includes('салазки') || name.includes('прицеп')) return 'Шасси и прицепы';
  if (name.includes('подогреватель') || name.includes('пжд')) return 'Системы подогрева';
  if (name.includes('сварочный') || name.includes('сварка')) return 'Сварочное оборудование';
  if (name.includes('компрессор')) return 'Компрессоры';
  if (name.includes('насос')) return 'Насосы';
  if (name.includes('станок')) return 'Станки';
  
  return 'Промышленное оборудование';
}

function getFirstImageUrl(pictureField: string): string {
  if (!pictureField) return '';
  
  const urls = pictureField.split(',').map(url => url.trim());
  const firstUrl = urls[0];
  
  if (firstUrl && (firstUrl.startsWith('http://') || firstUrl.startsWith('https://'))) {
    return firstUrl;
  }
  
  return '';
}

async function completeTSSImport() {
  console.log('🚀 Начинаем ПОЛНЫЙ импорт всех TSS.RU товаров с уникальными slug...');
  
  const client = await pool.connect();
  
  try {
    // Удаляем существующие TSS товары
    console.log('🗑️ Удаляем существующие TSS товары...');
    await client.query('DELETE FROM products WHERE tag = $1', ['tss']);
    
    const csvPath = path.join(process.cwd(), 'attached_assets', 'products (2)_1752679653734.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records: TSSProduct[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`📊 Найдено ${records.length} товаров в CSV файле`);
    
    // Получаем существующие категории
    const categoryResult = await client.query('SELECT id, name FROM categories');
    const existingCategories = new Map(categoryResult.rows.map(row => [row.name, row.id]));
    
    // Создаем недостающие категории
    const neededCategories = new Set<string>();
    records.forEach(record => {
      if (record.name && record.name.trim()) {
        const categoryName = getCategoryFromName(record.name);
        neededCategories.add(categoryName);
      }
    });
    
    for (const categoryName of neededCategories) {
      if (!existingCategories.has(categoryName)) {
        const result = await client.query(
          'INSERT INTO categories (name, slug, description, icon) VALUES ($1, $2, $3, $4) RETURNING id',
          [
            categoryName,
            generateUniqueSlug(categoryName, 0),
            `Категория ${categoryName} от поставщика TSS.RU`,
            'settings'
          ]
        );
        existingCategories.set(categoryName, result.rows[0].id);
        console.log(`✅ Создана категория: ${categoryName}`);
      }
    }
    
    // Подготавливаем товары для вставки - по одному
    console.log('📦 Начинаем поштучный импорт товаров...');
    let importedCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      if (!record.name || !record.name.trim()) continue;
      
      const productName = cleanText(record.name);
      const description = cleanText(record.description || productName);
      const price = extractPrice(record.price);
      const categoryName = getCategoryFromName(productName);
      const categoryId = existingCategories.get(categoryName);
      const imageUrl = getFirstImageUrl(record.picture);
      const uniqueSlug = generateUniqueSlug(productName, i);
      
      try {
        await client.query(
          `INSERT INTO products (
            name, sku, slug, description, short_description, price, 
            original_price, image_url, category_id, stock, is_active, is_featured, tag
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            productName,
            record.id || `TSS-${Date.now()}-${i}`,
            uniqueSlug,
            description,
            description.substring(0, 200),
            price.toString(),
            null,
            imageUrl,
            categoryId,
            null,
            true,
            false,
            'tss'
          ]
        );
        
        importedCount++;
        if (importedCount % 100 === 0) {
          console.log(`✅ Импортировано: ${importedCount}/${records.length} товаров`);
        }
        
      } catch (error) {
        console.error(`❌ Ошибка импорта товара ${i + 1}: ${productName}`, error);
      }
    }
    
    console.log(`\n🎉 ПОЛНЫЙ ИМПОРТ ЗАВЕРШЕН!`);
    console.log(`✅ Успешно импортировано: ${importedCount} товаров TSS.RU из ${records.length}`);
    console.log(`📊 Процент успеха: ${Math.round((importedCount / records.length) * 100)}%`);
    
  } catch (error) {
    console.error('💥 Критическая ошибка при импорте:', error);
  } finally {
    client.release();
  }
}

// Запускаем полный импорт
completeTSSImport()
  .then(() => {
    console.log('🏁 Полный импорт TSS завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
  });

export { completeTSSImport };