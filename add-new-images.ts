import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

async function addNewImages() {
    console.log('🚀 Добавляем новые изображения DCK...\n');
    
    // Список новых изображений с временными метками
    const newImages = [
        'FFBL2020_1751720246243.png',
        'FFBL2040_1751720246243.png', 
        'FFBL2060_1751720246244.png',
        'KDJF22(TYPE DM)_1751720246244.png',
        'KDJZ03-13(TYPE EM)_1751720246244.png',
        'KDJZ03-13(TYPE Z)_1751720246244.png',
        'KDJZ04-13(TYPE EM)_1751720246244.png',
        'KDJZ04-13(TYPE Z)_1751720246245.png',
        'KDJZ05-13(TYPE EM)_1751720246245.png',
        'KDJZ05-13(TYPE Z)_1751720246245.png',
        'KDJZ06-13(TYPE EM)_1751720246245.png',
        'KDJZ06-13(TYPE Z)_1751720246245.png'
    ];
    
    try {
        // Получаем все товары
        const allProducts = await storage.getAllProducts();
        console.log(`📦 Найдено товаров в базе: ${allProducts.length}`);
        
        // Создаем папку для изображений если её нет
        const publicImagesDir = 'client/public/images/products/';
        if (!fs.existsSync(publicImagesDir)) {
            fs.mkdirSync(publicImagesDir, { recursive: true });
        }
        
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const imageFile of newImages) {
            try {
                // Извлекаем SKU из имени файла - оставляем TYPE как часть артикула
                let sku = imageFile.replace(/_\d+\.png$/, '').replace(/\.png$/i, '');
                
                console.log(`🔍 Обработка: ${imageFile} -> SKU: ${sku}`);
                
                // Ищем товар по SKU (точное соответствие)
                const product = allProducts.find(p => 
                    p.sku.toLowerCase() === sku.toLowerCase()
                );
                
                if (!product) {
                    console.log(`❓ Товар не найден для SKU: ${sku}`);
                    skippedCount++;
                    continue;
                }
                
                if (product.imageUrl) {
                    console.log(`⏭️ У товара ${sku} уже есть изображение`);
                    skippedCount++;
                    continue;
                }
                
                // Копируем изображение
                const sourcePath = path.join('attached_assets', imageFile);
                const cleanSku = sku.replace(/[^a-zA-Z0-9\-()]/g, '');
                const targetPath = path.join(publicImagesDir, `${cleanSku}.png`);
                
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                    
                    // Обновляем товар в базе данных
                    const webImagePath = `/images/products/${cleanSku}.png`;
                    await storage.updateProduct(product.id, {
                        imageUrl: webImagePath
                    });
                    
                    console.log(`✅ Добавлено изображение для: ${sku} (${product.name})`);
                    addedCount++;
                } else {
                    console.log(`❌ Файл не найден: ${sourcePath}`);
                    skippedCount++;
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${imageFile}:`, error);
                skippedCount++;
            }
        }
        
        console.log('\n🎉 Обработка завершена!');
        console.log(`✅ Добавлено изображений: ${addedCount}`);
        console.log(`⏭️ Пропущено: ${skippedCount}`);
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

addNewImages().then(() => process.exit(0));