import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

function findImageForSku(sku: string, attachedFiles: string[]): string | null {
    // Точное соответствие
    let found = attachedFiles.find(file => 
        file.toLowerCase().includes(sku.toLowerCase()) && 
        file.toLowerCase().endsWith('.png')
    );
    
    if (found) return found;
    
    // Поиск без скобок и спецсимволов
    const cleanSku = sku.replace(/[()]/g, '').replace(/\s+/g, '');
    found = attachedFiles.find(file => 
        file.toLowerCase().includes(cleanSku.toLowerCase()) && 
        file.toLowerCase().endsWith('.png')
    );
    
    if (found) return found;
    
    // Поиск по основной части артикула (до первой скобки)
    const baseSku = sku.split('(')[0].trim();
    found = attachedFiles.find(file => 
        file.toLowerCase().includes(baseSku.toLowerCase()) && 
        file.toLowerCase().endsWith('.png')
    );
    
    return found || null;
}

async function fixAllBrokenImages() {
    console.log('🔧 Исправление всех сломанных путей к изображениям...\n');
    
    try {
        const allProducts = await storage.getAllProducts();
        const attachedFiles = fs.readdirSync('attached_assets/');
        const publicImagesDir = 'client/public/images/products/';
        
        // Создаем папку если её нет
        if (!fs.existsSync(publicImagesDir)) {
            fs.mkdirSync(publicImagesDir, { recursive: true });
        }
        
        let fixedCount = 0;
        let notFoundCount = 0;
        let alreadyWorkingCount = 0;
        
        console.log(`📦 Обрабатываем ${allProducts.length} товаров...\n`);
        
        for (const product of allProducts) {
            try {
                const { id, sku, imageUrl } = product;
                
                // Проверяем, нужно ли исправлять путь
                if (!imageUrl) {
                    // Товар без изображения - пробуем найти
                    const foundFile = findImageForSku(sku, attachedFiles);
                    
                    if (foundFile) {
                        console.log(`🔍 Найдено изображение для ${sku}: ${foundFile}`);
                        
                        const sourcePath = path.join('attached_assets', foundFile);
                        const cleanSku = sku.replace(/[^a-zA-Z0-9\-()]/g, '');
                        const targetFileName = `${cleanSku}.png`;
                        const targetPath = path.join(publicImagesDir, targetFileName);
                        
                        // Копируем файл
                        if (!fs.existsSync(targetPath)) {
                            fs.copyFileSync(sourcePath, targetPath);
                        }
                        
                        // Обновляем базу данных
                        const webPath = `/images/products/${targetFileName}`;
                        await storage.updateProduct(id, { imageUrl: webPath });
                        
                        console.log(`✅ Добавлено изображение для ${sku}`);
                        fixedCount++;
                    } else {
                        console.log(`❓ Изображение не найдено для ${sku}`);
                        notFoundCount++;
                    }
                    continue;
                }
                
                // Проверяем, работает ли текущий путь
                const isWorkingPath = imageUrl.startsWith('/images/products/');
                
                if (isWorkingPath) {
                    // Проверяем, существует ли файл
                    const fileName = imageUrl.replace('/images/products/', '');
                    const fullPath = path.join(publicImagesDir, fileName);
                    
                    if (fs.existsSync(fullPath)) {
                        alreadyWorkingCount++;
                        continue;
                    }
                }
                
                // Путь сломан - пробуем исправить
                console.log(`🔧 Исправляем сломанный путь для ${sku}: ${imageUrl}`);
                
                const foundFile = findImageForSku(sku, attachedFiles);
                
                if (foundFile) {
                    const sourcePath = path.join('attached_assets', foundFile);
                    const cleanSku = sku.replace(/[^a-zA-Z0-9\-()]/g, '');
                    const targetFileName = `${cleanSku}.png`;
                    const targetPath = path.join(publicImagesDir, targetFileName);
                    
                    // Копируем файл если его еще нет
                    if (!fs.existsSync(targetPath)) {
                        fs.copyFileSync(sourcePath, targetPath);
                        console.log(`📂 Скопирован: ${foundFile} -> ${targetFileName}`);
                    }
                    
                    // Обновляем путь в базе данных
                    const newImageUrl = `/images/products/${targetFileName}`;
                    await storage.updateProduct(id, { imageUrl: newImageUrl });
                    
                    console.log(`✅ Исправлен путь для ${sku}`);
                    fixedCount++;
                } else {
                    console.log(`❓ Изображение не найдено для ${sku}`);
                    notFoundCount++;
                }
                
                // Пауза между операциями
                if ((fixedCount + notFoundCount) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${product.sku}:`, error);
                notFoundCount++;
            }
        }
        
        console.log('\n🎉 Исправление завершено!');
        console.log(`✅ Исправлено: ${fixedCount}`);
        console.log(`⏭️ Уже работали: ${alreadyWorkingCount}`);
        console.log(`❓ Не найдено: ${notFoundCount}`);
        
        // Финальная статистика
        const finalImageCount = fs.readdirSync(publicImagesDir).length;
        console.log(`📁 Итого файлов в /images/products/: ${finalImageCount}`);
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

fixAllBrokenImages().then(() => process.exit(0));