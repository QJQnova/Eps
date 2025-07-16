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

async function robustCompleteImport() {
  console.log('🚀 Начинаем РОБАСТНЫЙ импорт всех 2586 TSS товаров...');
  
  const client = await pool.connect();
  
  try {
    // Полная очистка TSS товаров
    await client.query('DELETE FROM products WHERE tag = $1', ['tss']);
    console.log('🗑️ Очищены все существующие TSS товары');
    
    const csvPath = path.join(process.cwd(), 'attached_assets', 'products (2)_1752679653734.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records: TSSProduct[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`📊 Обрабатываем ${records.length} товаров из CSV`);
    
    // Получаем существующие категории
    const categoryResult = await client.query('SELECT id, name FROM categories');
    const existingCategories = new Map(categoryResult.rows.map(row => [row.name, row.id]));
    
    // Функции для обработки данных
    const generateSlug = (text: string, index: number) => {
      return `tss-${text.toLowerCase()
        .replace(/[^a-zа-я0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()}-${index}`.substring(0, 100);
    };
    
    const cleanText = (text: any): string => {
      if (typeof text !== 'string') return 'Товар TSS';
      return text.trim().replace(/\s+/g, ' ') || 'Товар TSS';
    };
    
    const extractPrice = (priceText: string): number => {
      if (!priceText || priceText === '0') return 0;
      const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
      return isNaN(numericPrice) ? 0 : numericPrice;
    };
    
    const getCategoryName = (productName: string): string => {
      const name = productName.toLowerCase();
      if (name.includes('генератор')) return 'Генераторы';
      if (name.includes('двигатель')) return 'Двигатели';
      if (name.includes('компрессор')) return 'Компрессоры';
      if (name.includes('насос')) return 'Насосы';
      if (name.includes('сварочный') || name.includes('сварка')) return 'Сварочное оборудование';
      return 'Промышленное оборудование';
    };
    
    // Создаем базовые категории
    const baseCategories = ['Генераторы', 'Двигатели', 'Компрессоры', 'Насосы', 'Сварочное оборудование', 'Промышленное оборудование'];
    
    for (const categoryName of baseCategories) {
      if (!existingCategories.has(categoryName)) {
        const result = await client.query(
          'INSERT INTO categories (name, slug, description, icon) VALUES ($1, $2, $3, $4) RETURNING id',
          [
            categoryName,
            categoryName.toLowerCase().replace(/\s+/g, '-'),
            `Категория ${categoryName}`,
            'settings'
          ]
        );
        existingCategories.set(categoryName, result.rows[0].id);
      }
    }
    
    // Массовая подготовка данных
    const allProductData = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      if (!record.name || !record.name.trim()) {
        continue;
      }
      
      const productName = cleanText(record.name);
      const description = cleanText(record.description) || productName;
      const price = extractPrice(record.price);
      const categoryName = getCategoryName(productName);
      const categoryId = existingCategories.get(categoryName);
      const slug = generateSlug(productName, i);
      const sku = record.id || `TSS-${i}`;
      
      allProductData.push({
        name: productName,
        sku: sku,
        slug: slug,
        description: description,
        short_description: description.substring(0, 150),
        price: price.toString(),
        original_price: null,
        image_url: '',
        category_id: categoryId,
        stock: null,
        is_active: true,
        is_featured: false,
        tag: 'tss'
      });
    }
    
    console.log(`📦 Подготовлено ${allProductData.length} товаров для импорта`);
    
    // Массовая вставка блоками по 1000
    const batchSize = 1000;
    let totalImported = 0;
    
    for (let i = 0; i < allProductData.length; i += batchSize) {
      const batch = allProductData.slice(i, i + batchSize);
      
      try {
        // Подготавливаем массовый INSERT
        const values = [];
        const placeholders = [];
        
        for (let j = 0; j < batch.length; j++) {
          const product = batch[j];
          const baseIndex = j * 13;
          
          values.push(
            product.name,
            product.sku,
            product.slug,
            product.description,
            product.short_description,
            product.price,
            product.original_price,
            product.image_url,
            product.category_id,
            product.stock,
            product.is_active,
            product.is_featured,
            product.tag
          );
          
          placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13})`);
        }
        
        const query = `
          INSERT INTO products (
            name, sku, slug, description, short_description, price,
            original_price, image_url, category_id, stock, is_active, is_featured, tag
          ) VALUES ${placeholders.join(', ')}
        `;
        
        await client.query(query, values);
        totalImported += batch.length;
        
        console.log(`✅ Импортировано: ${totalImported}/${allProductData.length} товаров`);
        
      } catch (error) {
        console.error(`❌ Ошибка импорта блока ${i + 1}-${Math.min(i + batchSize, allProductData.length)}:`, error);
      }
    }
    
    console.log(`\n🎉 РОБАСТНЫЙ ИМПОРТ ЗАВЕРШЕН!`);
    console.log(`✅ Итого импортировано: ${totalImported} товаров из ${allProductData.length}`);
    console.log(`📊 Успешность: ${Math.round((totalImported / allProductData.length) * 100)}%`);
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  } finally {
    client.release();
  }
}

robustCompleteImport()
  .then(() => {
    console.log('🏁 Робастный импорт завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });