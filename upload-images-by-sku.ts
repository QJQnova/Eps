
import { readFileSync, readdirSync, existsSync, copyFileSync } from 'fs';
import { DatabaseStorage } from './server/storage';
import path from 'path';

// Функция для поиска и копирования изображения по артикулу
function findAndCopyImageForSKU(sku: string, sourceImageDir: string): string | null {
  const targetImageDir = './client/public/images/products/';
  
  if (!existsSync(sourceImageDir)) {
    console.log('❌ Папка с исходными изображениями не найдена:', sourceImageDir);
    return null;
  }

  if (!existsSync(targetImageDir)) {
    console.log('📁 Создаем папку для изображений товаров...');
    require('fs').mkdirSync(targetImageDir, { recursive: true });
  }

  const imageFiles = readdirSync(sourceImageDir);
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.JPG', '.JPEG', '.PNG', '.WEBP', '.SVG'];
  
  // Ищем файл с точным совпадением артикула
  for (const ext of extensions) {
    const exactMatch = `${sku}${ext}`;
    if (imageFiles.includes(exactMatch)) {
      const sourcePath = path.join(sourceImageDir, exactMatch);
      const targetPath = path.join(targetImageDir, exactMatch);
      
      try {
        copyFileSync(sourcePath, targetPath);
        console.log(`📋 Скопировано изображение: ${exactMatch}`);
        return `/images/products/${exactMatch}`;
      } catch (error) {
        console.log(`❌ Ошибка копирования ${exactMatch}:`, error);
      }
    }
  }
  
  // Ищем файл, содержащий артикул в названии (без учета регистра)
  const skuLower = sku.toLowerCase();
  for (const file of imageFiles) {
    const fileName = file.toLowerCase();
    if (fileName.includes(skuLower) && extensions.some(ext => fileName.endsWith(ext.toLowerCase()))) {
      const sourcePath = path.join(sourceImageDir, file);
      const newFileName = `${sku}${path.extname(file)}`;
      const targetPath = path.join(targetImageDir, newFileName);
      
      try {
        copyFileSync(sourcePath, targetPath);
        console.log(`📋 Скопировано и переименовано: ${file} -> ${newFileName}`);
        return `/images/products/${newFileName}`;
      } catch (error) {
        console.log(`❌ Ошибка копирования ${file}:`, error);
      }
    }
  }
  
  console.log(`📷 Изображение для артикула ${sku} не найдено`);
  return null;
}

// Основная функция загрузки изображений
async function uploadImagesBySKU() {
  try {
    console.log('🖼️ Начинаем загрузку изображений по артикулам...');
    
    const storage = new DatabaseStorage();
    
    // ВАЖНО: Укажите путь к папке с вашими изображениями!
    const sourceImageDir = './attached_assets/images'; // Замените на путь к вашей папке с изображениями
    
    console.log(`📁 Ищем изображения в папке: ${sourceImageDir}`);
    
    if (!existsSync(sourceImageDir)) {
      console.log('❌ Папка с изображениями не найдена!');
      console.log('💡 Создайте папку ./attached_assets/images и поместите туда ваши изображения');
      console.log('💡 Или измените путь sourceImageDir в коде на правильный');
      return;
    }
    
    // Получаем все товары из базы данных
    const products = await storage.getAllProducts();
    console.log(`📦 Найдено товаров в базе: ${products.length}`);
    
    let updatedCount = 0;
    let foundCount = 0;
    let notFoundCount = 0;
    
    // Проходим по каждому товару и ищем изображение
    for (const product of products) {
      if (!product.sku) {
        console.log(`⚠️ Товар "${product.name}" не имеет артикула, пропускаем`);
        continue;
      }
      
      // Ищем и копируем изображение для товара
      const imageUrl = findAndCopyImageForSKU(product.sku, sourceImageDir);
      
      if (imageUrl) {
        foundCount++;
        
        // Обновляем товар в базе данных только если изображения еще нет
        if (!product.imageUrl || product.imageUrl.trim() === '') {
          try {
            await storage.updateProduct(product.id, {
              imageUrl: imageUrl
            });
            updatedCount++;
            console.log(`✅ Обновлен товар: ${product.sku} - ${product.name}`);
          } catch (error: any) {
            console.log(`❌ Ошибка обновления товара ${product.sku}: ${error.message}`);
          }
        } else {
          console.log(`ℹ️ Товар ${product.sku} уже имеет изображение, пропускаем обновление`);
        }
      } else {
        notFoundCount++;
      }
      
      // Показываем прогресс каждые 50 товаров
      if ((foundCount + notFoundCount) % 50 === 0) {
        console.log(`📊 Обработано: ${foundCount + notFoundCount} товаров`);
      }
    }
    
    console.log('\n🎉 Загрузка изображений завершена!');
    console.log(`🖼️ Найдено изображений: ${foundCount}`);
    console.log(`📝 Обновлено товаров: ${updatedCount}`);
    console.log(`❌ Не найдено изображений: ${notFoundCount}`);
    console.log(`📦 Всего товаров обработано: ${products.length}`);
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message);
  }
}

// Запускаем загрузку
uploadImagesBySKU().then(() => {
  console.log('✅ Скрипт завершен успешно');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Ошибка:', error);
  process.exit(1);
});
