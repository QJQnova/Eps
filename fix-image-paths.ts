import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

async function fixImagePaths() {
    console.log('🔧 Исправление путей к изображениям...\n');
    
    try {
        // Получаем все товары с изображениями
        const allProducts = await storage.getAllProducts();
        const productsWithImages = allProducts.filter(p => p.imageUrl);
        
        console.log(`📦 Найдено товаров с изображениями: ${productsWithImages.length}`);
        
        // Создаем папку для изображений если её нет
        const publicImagesDir = 'client/public/images/products/';
        if (!fs.existsSync(publicImagesDir)) {
            fs.mkdirSync(publicImagesDir, { recursive: true });
        }
        
        let fixedCount = 0;
        let alreadyCorrect = 0;
        let errorCount = 0;
        
        for (const product of productsWithImages) {
            try {
                const imageUrl = product.imageUrl;
                
                // Проверяем, нужно ли исправлять путь
                if (imageUrl.startsWith('/images/products/')) {
                    alreadyCorrect++;
                    continue;
                }
                
                // Ищем изображение по SKU в attached_assets
                const attachedDir = 'attached_assets/';
                const allFiles = fs.readdirSync(attachedDir);
                
                // Ищем файл по артикулу
                const sku = product.sku;
                const possibleFiles = allFiles.filter(file => 
                    file.toLowerCase().endsWith('.png') && 
                    file.includes(sku)
                );
                
                if (possibleFiles.length > 0) {
                    const sourceFile = possibleFiles[0]; // Берем первый найденный
                    const sourcePath = path.join(attachedDir, sourceFile);
                    
                    // Создаем корректное имя файла
                    const cleanSku = sku.replace(/[^a-zA-Z0-9\-()]/g, '');
                    const targetFileName = `${cleanSku}.png`;
                    const targetPath = path.join(publicImagesDir, targetFileName);
                    
                    // Копируем файл если его еще нет
                    if (!fs.existsSync(targetPath)) {
                        fs.copyFileSync(sourcePath, targetPath);
                        console.log(`📂 Скопирован: ${sourceFile} -> ${targetFileName}`);
                    }
                    
                    // Обновляем путь в базе данных
                    const newImageUrl = `/images/products/${targetFileName}`;
                    await storage.updateProduct(product.id, {
                        imageUrl: newImageUrl
                    });
                    
                    console.log(`✅ Исправлен путь для: ${sku}`);
                    fixedCount++;
                    
                } else {
                    console.log(`❓ Изображение не найдено для: ${sku}`);
                    errorCount++;
                }
                
                // Пауза между операциями
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${product.sku}:`, error);
                errorCount++;
            }
        }
        
        console.log('\n🎉 Исправление путей завершено!');
        console.log(`✅ Исправлено: ${fixedCount}`);
        console.log(`⏭️ Уже корректно: ${alreadyCorrect}`);
        console.log(`❌ Ошибок: ${errorCount}`);
        
        // Проверяем результат
        const finalCount = fs.readdirSync(publicImagesDir).length;
        console.log(`📁 Итого файлов в /images/products/: ${finalCount}`);
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

fixImagePaths().then(() => process.exit(0));