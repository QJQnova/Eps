import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

async function fixMissingImages() {
    console.log('🔍 Поиск и добавление всех пропущенных изображений...\n');
    
    try {
        // Получаем все файлы из attached_assets
        const attachedFiles = fs.readdirSync('attached_assets/');
        const imageFiles = attachedFiles.filter(file => 
            file.toLowerCase().endsWith('.png') || 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg')
        );
        
        console.log(`📁 Всего изображений в attached_assets: ${imageFiles.length}`);
        
        // Получаем все товары
        const allProducts = await storage.getAllProducts();
        const publicImagesDir = 'client/public/images/products/';
        
        let processedCount = 0;
        let replacedCount = 0;
        let addedCount = 0;
        
        // Обрабатываем каждое изображение более агрессивно
        for (const imageFile of imageFiles) {
            try {
                // Извлекаем базовое имя файла без расширения
                const baseName = imageFile.replace(/\.(png|jpg|jpeg)$/i, '');
                
                // Убираем timestamp если есть
                const cleanBaseName = baseName.split('_')[0];
                
                console.log(`🔍 Обрабатываем: ${imageFile} (базовое имя: ${cleanBaseName})`);
                
                // Ищем товар различными способами
                let matchedProduct = null;
                
                // 1. Точное соответствие SKU
                matchedProduct = allProducts.find(p => p.sku === cleanBaseName);
                
                // 2. Точное соответствие без учета регистра
                if (!matchedProduct) {
                    matchedProduct = allProducts.find(p => 
                        p.sku.toLowerCase() === cleanBaseName.toLowerCase()
                    );
                }
                
                // 3. Поиск по включению (SKU содержит имя файла)
                if (!matchedProduct) {
                    matchedProduct = allProducts.find(p => 
                        p.sku.toLowerCase().includes(cleanBaseName.toLowerCase())
                    );
                }
                
                // 4. Поиск по включению (имя файла содержит SKU)
                if (!matchedProduct) {
                    matchedProduct = allProducts.find(p => 
                        cleanBaseName.toLowerCase().includes(p.sku.toLowerCase())
                    );
                }
                
                // 5. Поиск без спецсимволов
                if (!matchedProduct) {
                    const cleanFileNameNoSymbols = cleanBaseName.replace(/[^a-zA-Z0-9]/g, '');
                    matchedProduct = allProducts.find(p => {
                        const cleanSkuNoSymbols = p.sku.replace(/[^a-zA-Z0-9]/g, '');
                        return cleanSkuNoSymbols.toLowerCase() === cleanFileNameNoSymbols.toLowerCase();
                    });
                }
                
                if (matchedProduct) {
                    const { id, sku } = matchedProduct;
                    
                    // Создаем правильное имя файла
                    const sourcePath = path.join('attached_assets', imageFile);
                    const extension = imageFile.split('.').pop();
                    const targetFileName = `${sku}.${extension}`;
                    const targetPath = path.join(publicImagesDir, targetFileName);
                    
                    // Проверяем текущее изображение
                    const currentImageUrl = matchedProduct.imageUrl;
                    const isCurrentlySvg = currentImageUrl && currentImageUrl.endsWith('.svg');
                    const hasRealPhoto = currentImageUrl && (
                        currentImageUrl.endsWith('.png') || 
                        currentImageUrl.endsWith('.jpg') || 
                        currentImageUrl.endsWith('.jpeg')
                    );
                    
                    // Копируем и обновляем если нужно
                    if (isCurrentlySvg || !hasRealPhoto) {
                        // Копируем файл
                        fs.copyFileSync(sourcePath, targetPath);
                        
                        // Обновляем базу данных
                        const newImageUrl = `/images/products/${targetFileName}`;
                        await storage.updateProduct(id, { imageUrl: newImageUrl });
                        
                        if (isCurrentlySvg) {
                            console.log(`🔄 Заменена SVG на фото для ${sku}: ${imageFile}`);
                            replacedCount++;
                        } else {
                            console.log(`✅ Добавлено изображение для ${sku}: ${imageFile}`);
                            addedCount++;
                        }
                        
                        processedCount++;
                    } else {
                        console.log(`⏭️ У товара ${sku} уже есть фото`);
                    }
                } else {
                    console.log(`❓ Товар не найден для: ${imageFile}`);
                }
                
                // Пауза
                if (processedCount % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${imageFile}:`, error);
            }
        }
        
        console.log('\n🎉 Обработка завершена!');
        console.log(`✅ Добавлено новых изображений: ${addedCount}`);
        console.log(`🔄 Заменено SVG на фото: ${replacedCount}`);
        console.log(`📊 Всего обработано: ${processedCount}`);
        
        // Финальная статистика
        const finalImageCount = fs.readdirSync(publicImagesDir).length;
        const realPhotoCount = fs.readdirSync(publicImagesDir).filter(f => 
            f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
        ).length;
        const svgCount = fs.readdirSync(publicImagesDir).filter(f => f.endsWith('.svg')).length;
        
        console.log(`📁 Итого файлов в папке: ${finalImageCount}`);
        console.log(`📸 Реальных фотографий: ${realPhotoCount}`);
        console.log(`🎨 SVG иконок: ${svgCount}`);
        
        // Проверяем конкретно LB1220-1
        const lb1220Product = allProducts.find(p => p.sku === 'LB1220-1');
        if (lb1220Product) {
            console.log('\n🔍 Проверка LB1220-1:');
            console.log(`Текущий путь: ${lb1220Product.imageUrl}`);
            const targetFile = path.join(publicImagesDir, 'LB1220-1.png');
            console.log(`Файл существует: ${fs.existsSync(targetFile) ? '✅' : '❌'}`);
        }
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

fixMissingImages().then(() => process.exit(0));