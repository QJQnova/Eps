import { storage } from './server/storage';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

async function downloadProductImages() {
  console.log('Скачиваю изображения товаров для локального хранения...');
  
  try {
    // Создаем папку для изображений
    await fs.mkdir('./client/public/images/products', { recursive: true });
    
    // Получаем товары с изображениями
    const products = await storage.getProductsByCategoryId(52);
    console.log(`Найдено ${products.length} товаров для скачивания изображений`);
    
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.startsWith('https://pittools.ru')) {
        try {
          console.log(`Скачиваю изображение для ${product.name}...`);
          
          const response = await fetch(product.imageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.ok) {
            const fileName = `${product.sku}.${product.imageUrl.split('.').pop()}`;
            const localPath = `./client/public/images/products/${fileName}`;
            
            // Скачиваем файл
            const fileStream = createWriteStream(localPath);
            await pipeline(response.body, fileStream);
            
            // Обновляем путь в базе данных
            await storage.updateProduct(product.id, {
              ...product,
              imageUrl: `/images/products/${fileName}`
            });
            
            console.log(`✓ Сохранено: ${fileName}`);
          } else {
            console.log(`❌ Ошибка загрузки: ${product.imageUrl} (${response.status})`);
          }
        } catch (error) {
          console.log(`❌ Ошибка при скачивании ${product.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Загрузка изображений завершена');
    return true;
    
  } catch (error) {
    console.error('Ошибка при скачивании изображений:', error);
    return false;
  }
}

downloadProductImages().catch(console.error);