import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

function extractSkuFromFilename(filename: string): string {
    // Удаляем расширение и временные метки
    let sku = filename.replace(/\.png$/i, '').replace(/_\d+$/, '');
    return sku.trim();
}

async function analyzeAllImages() {
    console.log('🔍 Анализ всех доступных изображений DCK...\n');
    
    try {
        // Получаем все товары
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
        
        // Создаем карту товаров по SKU
        const productsBySku = new Map();
        allProducts.forEach(product => {
            productsBySku.set(product.sku.toLowerCase(), product);
        });
        
        // Анализируем соответствия
        const matches = [];
        const noMatches = [];
        const alreadyHaveImages = [];
        
        for (const imageFile of imageFiles) {
            const sku = extractSkuFromFilename(imageFile);
            const product = productsBySku.get(sku.toLowerCase());
            
            if (product) {
                if (product.imageUrl) {
                    alreadyHaveImages.push({ sku, imageFile, product });
                } else {
                    matches.push({ sku, imageFile, product });
                }
            } else {
                noMatches.push({ sku, imageFile });
            }
        }
        
        console.log('📊 Результаты анализа:');
        console.log(`✅ Товары без изображений (можно добавить): ${matches.length}`);
        console.log(`⏭️ Товары уже с изображениями: ${alreadyHaveImages.length}`);
        console.log(`❌ Изображения без товаров: ${noMatches.length}`);
        
        if (matches.length > 0) {
            console.log('\n📋 Товары готовые для добавления изображений:');
            matches.forEach((match, i) => {
                console.log(`  ${i + 1}. ${match.sku} -> ${match.product.name.substring(0, 60)}...`);
            });
        }
        
        if (noMatches.length > 0) {
            console.log('\n❓ Изображения без соответствующих товаров:');
            noMatches.slice(0, 10).forEach((item, i) => {
                console.log(`  ${i + 1}. ${item.sku} (файл: ${item.imageFile})`);
            });
            if (noMatches.length > 10) {
                console.log(`  ... и еще ${noMatches.length - 10} файлов`);
            }
        }
        
        return { matches, alreadyHaveImages, noMatches };
        
    } catch (error) {
        console.error('💥 Ошибка анализа:', error);
        return null;
    }
}

async function addMissingImages() {
    console.log('\n🚀 Начинаем добавление недостающих изображений...\n');
    
    const analysisResult = await analyzeAllImages();
    if (!analysisResult) return;
    
    const { matches } = analysisResult;
    
    if (matches.length === 0) {
        console.log('✅ Все товары уже имеют изображения!');
        return;
    }
    
    // Создаем папку для изображений если её нет
    const publicImagesDir = 'client/public/images/products/';
    if (!fs.existsSync(publicImagesDir)) {
        fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    
    let addedCount = 0;
    let errorCount = 0;
    
    for (const match of matches) {
        try {
            const { sku, imageFile, product } = match;
            
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
                
                console.log(`✅ Добавлено изображение для: ${sku}`);
                addedCount++;
                
                // Пауза между операциями
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                console.log(`❌ Файл не найден: ${sourcePath}`);
                errorCount++;
            }
            
        } catch (error) {
            console.error(`❌ Ошибка обработки ${match.sku}:`, error);
            errorCount++;
        }
    }
    
    console.log('\n🎉 Добавление изображений завершено!');
    console.log(`✅ Успешно добавлено: ${addedCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--add')) {
        await addMissingImages();
    } else {
        await analyzeAllImages();
    }
    
    process.exit(0);
}

main().catch(console.error);