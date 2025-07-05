import * as fs from 'fs';
import { DatabaseStorage } from './server/storage';

const storage = new DatabaseStorage();

function generateToolIcon(sku: string, name: string): string {
    // Определяем тип инструмента по артикулу и названию
    const skuLower = sku.toLowerCase();
    const nameLower = name.toLowerCase();
    
    // Дрели и сверлильные станки
    if (skuLower.includes('kjc') || nameLower.includes('сверлильный') || nameLower.includes('дрель')) {
        return generateDrillIcon(sku);
    }
    
    // Аккумуляторы
    if (skuLower.includes('ffbl') || skuLower.includes('lb') || nameLower.includes('аккумулятор')) {
        return generateBatteryIcon(sku);
    }
    
    // Болгарки и шлифмашины
    if (skuLower.includes('ksm') || skuLower.includes('ksa') || nameLower.includes('шлифмашина')) {
        return generateGrinderIcon(sku);
    }
    
    // Циркулярные пилы
    if (skuLower.includes('ksp') || skuLower.includes('ksb') || nameLower.includes('пила')) {
        return generateSawIcon(sku);
    }
    
    // Перфораторы
    if (skuLower.includes('krh') || skuLower.includes('kzc') || nameLower.includes('перфоратор')) {
        return generateHammerIcon(sku);
    }
    
    // Лобзики
    if (skuLower.includes('ksj') || nameLower.includes('лобзик')) {
        return generateJigsawIcon(sku);
    }
    
    // Общий инструмент
    return generateGenericToolIcon(sku);
}

function generateDrillIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="drillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Основа дрели -->
  <rect x="40" y="80" width="120" height="40" rx="8" fill="url(#drillGrad)" stroke="#1e40af" stroke-width="2"/>
  
  <!-- Рукоятка -->
  <rect x="30" y="100" width="80" height="60" rx="12" fill="url(#drillGrad)" stroke="#1e40af" stroke-width="2"/>
  
  <!-- Патрон -->
  <circle cx="170" cy="100" r="12" fill="#64748b" stroke="#475569" stroke-width="2"/>
  
  <!-- Сверло -->
  <rect x="175" y="98" width="20" height="4" fill="#94a3b8"/>
  
  <!-- Логотип DCK -->
  <text x="100" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="185" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

function generateBatteryIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Основа батареи -->
  <rect x="60" y="60" width="80" height="120" rx="8" fill="url(#batteryGrad)" stroke="#991b1b" stroke-width="2"/>
  
  <!-- Плюсовой контакт -->
  <rect x="95" y="50" width="10" height="20" rx="2" fill="#374151"/>
  
  <!-- Индикатор заряда -->
  <rect x="70" y="70" width="60" height="8" rx="4" fill="#22c55e"/>
  <rect x="70" y="85" width="60" height="8" rx="4" fill="#22c55e"/>
  <rect x="70" y="100" width="60" height="8" rx="4" fill="#22c55e"/>
  <rect x="70" y="115" width="40" height="8" rx="4" fill="#fbbf24"/>
  
  <!-- Логотип DCK -->
  <text x="100" y="150" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="195" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

function generateGrinderIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grinderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Корпус -->
  <rect x="40" y="80" width="120" height="40" rx="8" fill="url(#grinderGrad)" stroke="#065f46" stroke-width="2"/>
  
  <!-- Рукоятка -->
  <rect x="30" y="100" width="80" height="50" rx="12" fill="url(#grinderGrad)" stroke="#065f46" stroke-width="2"/>
  
  <!-- Диск -->
  <circle cx="170" cy="100" r="25" fill="#6b7280" stroke="#4b5563" stroke-width="2"/>
  <circle cx="170" cy="100" r="18" fill="none" stroke="#374151" stroke-width="3"/>
  
  <!-- Защитный кожух -->
  <path d="M 145 100 A 25 25 0 0 1 170 75 A 25 25 0 0 1 195 100" fill="none" stroke="#374151" stroke-width="3"/>
  
  <!-- Логотип DCK -->
  <text x="100" y="135" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="185" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

function generateSawIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6d28d9;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Корпус пилы -->
  <rect x="30" y="70" width="100" height="60" rx="8" fill="url(#sawGrad)" stroke="#5b21b6" stroke-width="2"/>
  
  <!-- Пильный диск -->
  <circle cx="140" cy="100" r="30" fill="#6b7280" stroke="#374151" stroke-width="2"/>
  
  <!-- Зубья диска -->
  <polygon points="140,70 145,75 140,80 135,75" fill="#374151"/>
  <polygon points="170,100 165,105 160,100 165,95" fill="#374151"/>
  <polygon points="140,130 135,125 140,120 145,125" fill="#374151"/>
  <polygon points="110,100 115,95 120,100 115,105" fill="#374151"/>
  
  <!-- Защитный кожух -->
  <path d="M 110 100 A 30 30 0 0 1 140 70 A 30 30 0 0 1 170 100" fill="none" stroke="#374151" stroke-width="3"/>
  
  <!-- Логотип DCK -->
  <text x="80" y="110" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="185" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

function generateHammerIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hammerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c2410c;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Корпус перфоратора -->
  <rect x="40" y="80" width="120" height="40" rx="8" fill="url(#hammerGrad)" stroke="#9a3412" stroke-width="2"/>
  
  <!-- Рукоятка -->
  <rect x="30" y="100" width="80" height="60" rx="12" fill="url(#hammerGrad)" stroke="#9a3412" stroke-width="2"/>
  
  <!-- Патрон -->
  <rect x="160" y="95" width="25" height="10" rx="2" fill="#6b7280" stroke="#4b5563" stroke-width="1"/>
  
  <!-- Бур -->
  <rect x="180" y="98" width="15" height="4" fill="#94a3b8"/>
  
  <!-- Индикатор режима -->
  <circle cx="60" cy="90" r="4" fill="#fbbf24"/>
  
  <!-- Логотип DCK -->
  <text x="100" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="185" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

function generateJigsawIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jigsawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0891b2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0e7490;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Корпус лобзика -->
  <rect x="50" y="60" width="100" height="50" rx="8" fill="url(#jigsawGrad)" stroke="#155e75" stroke-width="2"/>
  
  <!-- Рукоятка -->
  <rect x="40" y="90" width="70" height="70" rx="12" fill="url(#jigsawGrad)" stroke="#155e75" stroke-width="2"/>
  
  <!-- Опорная плита -->
  <rect x="90" y="110" width="80" height="8" rx="2" fill="#6b7280" stroke="#4b5563" stroke-width="1"/>
  
  <!-- Пильное полотно -->
  <rect x="140" y="118" width="4" height="50" fill="#94a3b8"/>
  <path d="M140,118 L144,122 L140,126 L144,130 L140,134 L144,138 L140,142 L144,146 L140,150 L144,154 L140,158 L144,162 L140,166 L144,168" 
        stroke="#374151" stroke-width="1" fill="none"/>
  
  <!-- Логотип DCK -->
  <text x="85" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="195" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

function generateGenericToolIcon(sku: string): string {
    return `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="toolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4b5563;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Корпус инструмента -->
  <rect x="50" y="80" width="100" height="40" rx="8" fill="url(#toolGrad)" stroke="#1f2937" stroke-width="2"/>
  
  <!-- Рукоятка -->
  <rect x="40" y="100" width="80" height="60" rx="12" fill="url(#toolGrad)" stroke="#1f2937" stroke-width="2"/>
  
  <!-- Рабочая часть -->
  <rect x="150" y="95" width="30" height="10" rx="2" fill="#6b7280" stroke="#4b5563" stroke-width="1"/>
  
  <!-- Индикатор -->
  <circle cx="70" cy="90" r="3" fill="#22c55e"/>
  
  <!-- Логотип DCK -->
  <text x="90" y="135" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DCK</text>
  
  <!-- Артикул -->
  <text x="100" y="185" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="10">${sku}</text>
</svg>`.trim();
}

async function setFallbackImages() {
    console.log('🎨 Установка фолбэк изображений для товаров без фото...\n');
    
    try {
        const allProducts = await storage.getAllProducts();
        const productsWithoutImages = allProducts.filter(p => 
            !p.imageUrl || 
            p.imageUrl.includes('/home/ubuntu/') || 
            p.imageUrl.includes('image_')
        );
        
        console.log(`📦 Товаров без изображений: ${productsWithoutImages.length}`);
        
        let processedCount = 0;
        
        for (const product of productsWithoutImages) {
            try {
                const { id, sku, name } = product;
                
                // Генерируем SVG иконку
                const svgContent = generateToolIcon(sku, name);
                
                // Сохраняем SVG файл
                const fileName = `${sku.replace(/[^a-zA-Z0-9\-()]/g, '')}.svg`;
                const filePath = `client/public/images/products/${fileName}`;
                
                fs.writeFileSync(filePath, svgContent);
                
                // Обновляем базу данных
                const webPath = `/images/products/${fileName}`;
                await storage.updateProduct(id, { imageUrl: webPath });
                
                console.log(`✅ Создана иконка для ${sku}`);
                processedCount++;
                
                // Пауза между операциями
                if (processedCount % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки ${product.sku}:`, error);
            }
        }
        
        console.log(`\n🎉 Обработано товаров: ${processedCount}`);
        
        // Финальная статистика
        const finalImageCount = fs.readdirSync('client/public/images/products/').length;
        console.log(`📁 Итого файлов в /images/products/: ${finalImageCount}`);
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

setFallbackImages().then(() => process.exit(0));