import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

async function addNewImages() {
    console.log('🔄 Обновление товаров на реальные фотографии...\n');
    
    try {
        // Получаем все файлы из attached_assets
        const attachedFiles = fs.readdirSync('attached_assets/');
        const imageFiles = attachedFiles.filter(file => 
            file.toLowerCase().endsWith('.png') || 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg')
        );
        
        console.log(`📁 Найдено изображений в attached_assets: ${imageFiles.length}`);
        
        // Получаем все товары
        const allProducts = await storage.getAllProducts();
        const publicImagesDir = 'client/public/images/products/';
        
        let addedCount = 0;
        let replacedCount = 0;
        let skippedCount = 0;
        
        // Обрабатываем каждое изображение
        for (const imageFile of imageFiles) {
            try {
                // Извлекаем SKU из имени файла
                const fileName = imageFile.replace(/\.(png|jpg|jpeg)$/i, '');
                
                // Ищем соответствующий товар
                let matchedProduct = null;
                
                // Точное соответствие SKU
                matchedProduct = allProducts.find(p => {
                    const cleanSku = p.sku.replace(/[^a-zA-Z0-9\-()]/g, '');
                    const cleanFileName = fileName.replace(/[^a-zA-Z0-9\-()]/g, '');
                    return cleanSku.toLowerCase() === cleanFileName.toLowerCase();
                });
                
                // Поиск по частичному соответствию
                if (!matchedProduct) {
                    const baseFileName = fileName.split('_')[0]; // Убираем timestamp
                    matchedProduct = allProducts.find(p => 
                        baseFileName.toLowerCase().includes(p.sku.toLowerCase()) ||
                        p.sku.toLowerCase().includes(baseFileName.toLowerCase())
                    );
                }
                
                if (matchedProduct) {
                    const { id, sku } = matchedProduct;
                    
                    // Копируем файл в папку изображений
                    const sourcePath = path.join('attached_assets', imageFile);
                    const cleanSku = sku.replace(/[^a-zA-Z0-9\-()]/g, '');
                    const targetFileName = `${cleanSku}.${imageFile.split('.').pop()}`;
                    const targetPath = path.join(publicImagesDir, targetFileName);
                    
                    // Проверяем, есть ли уже изображение
                    const currentImageUrl = matchedProduct.imageUrl;
                    const isCurrentlySvg = currentImageUrl && currentImageUrl.endsWith('.svg');
                    
                    if (!fs.existsSync(targetPath) || isCurrentlySvg) {
                        fs.copyFileSync(sourcePath, targetPath);
                        
                        // Обновляем путь в базе данных
                        const newImageUrl = `/images/products/${targetFileName}`;
                        await storage.updateProduct(id, { imageUrl: newImageUrl });
                        
                        if (isCurrentlySvg) {
                            console.log(`🔄 Заменена SVG иконка на фото для ${sku}: ${imageFile}`);
                            replacedCount++;
                        } else {
                            console.log(`✅ Добавлено новое изображение для ${sku}: ${imageFile}`);
                            addedCount++;
                        }
                    } else {
                        console.log(`⏭️ Изображение уже есть для ${sku}`);
                        skippedCount++;
                    }
                } else {
                    console.log(`❓ Товар не найден для изображения: ${imageFile}`);
                }
                
                // Пауза между операциями
                if ((addedCount + replacedCount) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${imageFile}:`, error);
            }
        }
        
        console.log('\n🎉 Обновление завершено!');
        console.log(`✅ Добавлено новых: ${addedCount}`);
        console.log(`🔄 Заменено SVG на фото: ${replacedCount}`);
        console.log(`⏭️ Пропущено: ${skippedCount}`);
        
        // Финальная статистика
        const finalImageCount = fs.readdirSync(publicImagesDir).length;
        const realPhotoCount = fs.readdirSync(publicImagesDir).filter(f => 
            f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
        ).length;
        const svgCount = fs.readdirSync(publicImagesDir).filter(f => f.endsWith('.svg')).length;
        
        console.log(`📁 Итого файлов: ${finalImageCount}`);
        console.log(`📸 Реальных фотографий: ${realPhotoCount}`);
        console.log(`🎨 SVG иконок: ${svgCount}`);
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

addNewImages().then(() => process.exit(0));