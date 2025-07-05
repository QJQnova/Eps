import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

async function debugMissingImages() {
    console.log('🔍 Диагностика отсутствующих изображений...\n');
    
    try {
        // Получаем товары, которые видны на скриншоте
        const problematicSkus = [
            'KJC02-30',
            'KJC23', 
            'FFBL2080',
            'LB1220-1',
            'KDFG32(TYPE BM)'
        ];
        
        const allProducts = await storage.getAllProducts();
        
        console.log('📋 Анализ проблемных товаров:');
        
        for (const sku of problematicSkus) {
            const product = allProducts.find(p => p.sku === sku);
            if (product) {
                console.log(`\n📦 ${sku}:`);
                console.log(`  Название: ${product.name}`);
                console.log(`  ID: ${product.id}`);
                console.log(`  Путь к изображению: ${product.imageUrl || 'НЕТ'}`);
                
                if (product.imageUrl) {
                    const imagePath = product.imageUrl.replace('/images/products/', '');
                    const fullPath = path.join('client/public/images/products/', imagePath);
                    const exists = fs.existsSync(fullPath);
                    console.log(`  Файл существует: ${exists ? '✅' : '❌'}`);
                    
                    if (!exists) {
                        // Ищем файл в attached_assets
                        const attachedFiles = fs.readdirSync('attached_assets/');
                        const possibleFiles = attachedFiles.filter(file => 
                            file.toLowerCase().includes(sku.toLowerCase()) && 
                            file.toLowerCase().endsWith('.png')
                        );
                        console.log(`  Возможные файлы в attached_assets: ${possibleFiles.join(', ')}`);
                    }
                }
            } else {
                console.log(`❌ Товар ${sku} не найден в базе данных`);
            }
        }
        
        // Проверяем файлы в папке изображений
        console.log('\n📁 Файлы в /images/products/:');
        const imageFiles = fs.readdirSync('client/public/images/products/');
        imageFiles.forEach(file => console.log(`  ${file}`));
        
        // Проверяем файлы в attached_assets
        console.log('\n📁 Файлы в attached_assets/ (первые 20):');
        const attachedFiles = fs.readdirSync('attached_assets/');
        const pngFiles = attachedFiles.filter(f => f.toLowerCase().endsWith('.png')).slice(0, 20);
        pngFiles.forEach(file => console.log(`  ${file}`));
        
    } catch (error) {
        console.error('❌ Ошибка диагностики:', error);
    }
}

debugMissingImages().then(() => process.exit(0));