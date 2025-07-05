
import { readdirSync, existsSync, copyFileSync } from 'fs';
import path from 'path';

// Простое копирование всех изображений
function copyAllImages() {
  const sourceImageDir = './attached_assets/images'; // Путь к вашим изображениям
  const targetImageDir = './client/public/images/products/';
  
  if (!existsSync(sourceImageDir)) {
    console.log('❌ Папка с изображениями не найдена:', sourceImageDir);
    return;
  }

  if (!existsSync(targetImageDir)) {
    console.log('📁 Создаем папку для изображений товаров...');
    require('fs').mkdirSync(targetImageDir, { recursive: true });
  }

  const imageFiles = readdirSync(sourceImageDir);
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.JPG', '.JPEG', '.PNG', '.WEBP', '.SVG'];
  
  let copiedCount = 0;
  
  for (const file of imageFiles) {
    if (extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()))) {
      const sourcePath = path.join(sourceImageDir, file);
      const targetPath = path.join(targetImageDir, file);
      
      try {
        copyFileSync(sourcePath, targetPath);
        console.log(`📋 Скопировано: ${file}`);
        copiedCount++;
      } catch (error) {
        console.log(`❌ Ошибка копирования ${file}:`, error);
      }
    }
  }
  
  console.log(`\n🎉 Скопировано ${copiedCount} изображений!`);
}

copyAllImages();
