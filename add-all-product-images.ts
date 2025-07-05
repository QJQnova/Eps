import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

// Инициализация соединения с базой данных
const storage = new DatabaseStorage();

async function copyImageToPublic(sourcePath: string, sku: string): Promise<string | null> {
    try {
        const publicImagesDir = 'client/public/images/products/';
        
        // Создаем директорию если её нет
        if (!fs.existsSync(publicImagesDir)) {
            fs.mkdirSync(publicImagesDir, { recursive: true });
        }
        
        // Очищаем SKU от недопустимых символов для имени файла
        const cleanSku = sku.replace(/[^a-zA-Z0-9\-()]/g, '');
        const targetPath = path.join(publicImagesDir, `${cleanSku}.png`);
        
        // Копируем файл
        fs.copyFileSync(sourcePath, targetPath);
        
        // Возвращаем веб-путь к изображению
        return `/images/products/${cleanSku}.png`;
        
    } catch (error) {
        console.error(`Ошибка копирования изображения для ${sku}:`, error);
        return null;
    }
}

function extractSkuFromFilename(filename: string): string | null {
    // Удаляем расширение и временные метки
    let sku = filename.replace(/\.png$/i, '').replace(/_\d+$/, '');
    
    // Список паттернов для извлечения SKU
    const patterns = [
        // Прямое соответствие артикулу
        /^([A-Z]+\d+[A-Z]*[-]?\d*[A-Z]*(?:\([^)]+\))?)$/i,
        // Удаляем TYPE и другие суффиксы
        /^(.+?)(?:\(TYPE\s+[A-Z]+\))?$/i,
        // Базовые артикулы DCK
        /^(K[A-Z]+\d+(?:-\d+)?[A-Z]*)/i
    ];
    
    for (const pattern of patterns) {
        const match = sku.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    
    return sku; // Возвращаем как есть, если паттерны не сработали
}

async function addImagesToProducts() {
    console.log('🚀 Начинаем массовое добавление изображений к товарам DCK...\n');
    
    try {
        // Получаем все товары из базы данных
        const allProducts = await storage.getAllProducts();
        console.log(`📦 Найдено товаров в базе: ${allProducts.length}`);
        
        // Получаем список всех PNG файлов
        const attachedDir = 'attached_assets/';
        const allFiles = fs.readdirSync(attachedDir);
        const imageFiles = allFiles.filter(file => 
            file.toLowerCase().endsWith('.png') && 
            !file.includes('image_') && 
            !file.includes('bf881b0c') &&
            !file.includes('Pasted')
        );
        
        console.log(`🖼️ Найдено изображений: ${imageFiles.length}\n`);
        
        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // Создаем карту товаров по SKU для быстрого поиска
        const productsBySku = new Map();
        allProducts.forEach(product => {
            productsBySku.set(product.sku.toLowerCase(), product);
        });
        
        for (const imageFile of imageFiles) {
            try {
                const sku = extractSkuFromFilename(imageFile);
                if (!sku) {
                    console.log(`⚠️ Не удалось извлечь SKU из: ${imageFile}`);
                    skippedCount++;
                    continue;
                }
                
                // Ищем товар по SKU (без учета регистра)
                const product = productsBySku.get(sku.toLowerCase());
                
                if (!product) {
                    console.log(`❓ Товар не найден для SKU: ${sku} (файл: ${imageFile})`);
                    skippedCount++;
                    continue;
                }
                
                // Проверяем, есть ли уже изображение у товара
                if (product.imageUrl) {
                    console.log(`⏭️ У товара ${sku} уже есть изображение`);
                    skippedCount++;
                    continue;
                }
                
                // Копируем изображение в public директорию
                const sourcePath = path.join(attachedDir, imageFile);
                const webImagePath = await copyImageToPublic(sourcePath, sku);
                
                if (!webImagePath) {
                    console.log(`❌ Ошибка копирования изображения для ${sku}`);
                    errorCount++;
                    continue;
                }
                
                // Обновляем товар в базе данных
                await storage.updateProduct(product.id, {
                    imageUrl: webImagePath
                });
                
                console.log(`✅ Добавлено изображение для: ${sku} (${product.name})`);
                addedCount++;
                
                // Пауза для предотвращения перегрузки
                if (addedCount % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${imageFile}:`, error);
                errorCount++;
            }
        }
        
        console.log('\n🎉 Обработка завершена!');
        console.log(`✅ Добавлено изображений: ${addedCount}`);
        console.log(`⏭️ Пропущено: ${skippedCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

// Дополнительная функция для анализа совпадений
async function analyzeImageMatching() {
    console.log('🔍 Анализ соответствия изображений и товаров...\n');
    
    try {
        const allProducts = await storage.getAllProducts();
        const attachedDir = 'attached_assets/';
        const allFiles = fs.readdirSync(attachedDir);
        const imageFiles = allFiles.filter(file => 
            file.toLowerCase().endsWith('.png') && 
            !file.includes('image_') && 
            !file.includes('bf881b0c') &&
            !file.includes('Pasted')
        );
        
        console.log('📊 Найденные соответствия:');
        
        const productsBySku = new Map();
        allProducts.forEach(product => {
            productsBySku.set(product.sku.toLowerCase(), product);
        });
        
        let matchCount = 0;
        let noMatchCount = 0;
        
        for (const imageFile of imageFiles) {
            const sku = extractSkuFromFilename(imageFile);
            if (sku) {
                const product = productsBySku.get(sku.toLowerCase());
                if (product) {
                    console.log(`✅ ${sku} -> ${product.name}`);
                    matchCount++;
                } else {
                    console.log(`❌ ${sku} -> товар не найден`);
                    noMatchCount++;
                }
            }
        }
        
        console.log(`\n📈 Статистика:`);
        console.log(`✅ Найдено соответствий: ${matchCount}`);
        console.log(`❌ Без соответствий: ${noMatchCount}`);
        
    } catch (error) {
        console.error('Ошибка анализа:', error);
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--analyze')) {
        await analyzeImageMatching();
    } else {
        await addImagesToProducts();
    }
    
    process.exit(0);
}

main().catch(console.error);