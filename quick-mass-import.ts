import { DatabaseStorage } from './server/storage';
import { type InsertCategory, type ProductInput } from './shared/schema';

// Функция для очистки строки
function cleanText(text: any): string {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ');
}

// Функция для генерации slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Функция для генерации URL изображения товара
function generateProductImage(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('дрель')) return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop';
  if (name.includes('шуруповерт')) return 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop';
  if (name.includes('гайковерт')) return 'https://images.unsplash.com/photo-1609205853540-a4eb8a98e85b?w=400&h=300&fit=crop';
  if (name.includes('перфоратор')) return 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&h=300&fit=crop';
  if (name.includes('болгарк')) return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop';
  if (name.includes('пила')) return 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&h=300&fit=crop';
  if (name.includes('рубанок')) return 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop';
  if (name.includes('фрезер')) return 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&h=300&fit=crop';
  if (name.includes('миксер')) return 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop';
  if (name.includes('генератор')) return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop';
  if (name.includes('компрессор')) return 'https://images.unsplash.com/photo-1621905251078-3f9c827d1fcf?w=400&h=300&fit=crop';
  if (name.includes('сварочн')) return 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=300&fit=crop';
  
  return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop';
}

// Функция для определения категории
function getCategoryFromProductName(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('дрель')) return 'Дрели';
  if (name.includes('шуруповерт')) return 'Шуруповерты';
  if (name.includes('гайковерт')) return 'Гайковерты';
  if (name.includes('перфоратор')) return 'Перфораторы';
  if (name.includes('болгарк')) return 'Углошлифовальные машины';
  if (name.includes('пила')) return 'Пилы';
  if (name.includes('рубанок')) return 'Рубанки';
  if (name.includes('фрезер')) return 'Фрезеры';
  if (name.includes('миксер')) return 'Миксеры';
  if (name.includes('генератор')) return 'Генераторы';
  if (name.includes('компрессор')) return 'Компрессоры';
  if (name.includes('сварочн')) return 'Сварочное оборудование';
  
  return 'Инструменты';
}

// Быстрое создание множества товаров
async function quickMassImport() {
  try {
    console.log('🚀 Быстрое массовое добавление товаров...');
    
    const storage = new DatabaseStorage();
    const categories = await storage.getAllCategories();
    
    // Создаем карту категорий для быстрого поиска
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name, cat.id);
    });
    
    // Генерируем большой набор товаров на основе популярных моделей
    const productTemplates = [
      // Дрели
      { name: 'Дрель ударная DCK HD-{N}', category: 'Дрели', basePrice: 8000 },
      { name: 'Дрель аккумуляторная P.I.T. PDL-{N}V', category: 'Дрели', basePrice: 12000 },
      { name: 'Дрель безударная BOSCH GSB-{N}', category: 'Дрели', basePrice: 15000 },
      
      // Шуруповерты
      { name: 'Шуруповерт DCK CDL-{N}V Li-ion', category: 'Шуруповерты', basePrice: 9000 },
      { name: 'Шуруповерт P.I.T. PSR-{N}', category: 'Шуруповерты', basePrice: 7500 },
      { name: 'Шуруповерт аккумуляторный MAKITA DF{N}', category: 'Шуруповерты', basePrice: 18000 },
      
      // Гайковерты
      { name: 'Гайковерт ударный DCK IWR-{N}', category: 'Гайковерты', basePrice: 14000 },
      { name: 'Гайковерт пневматический P.I.T. PAR-{N}', category: 'Гайковерты', basePrice: 11000 },
      
      // Перфораторы
      { name: 'Перфоратор SDS-Plus DCK RH-{N}', category: 'Перфораторы', basePrice: 16000 },
      { name: 'Перфоратор BOSCH GBH {N}-{M}', category: 'Перфораторы', basePrice: 22000 },
      
      // Болгарки
      { name: 'УШМ DCK AG-{N}/1{M}00', category: 'Углошлифовальные машины', basePrice: 6500 },
      { name: 'Болгарка P.I.T. PAG-{N}', category: 'Углошлифовальные машины', basePrice: 8000 },
      
      // Пилы
      { name: 'Пила циркулярная DCK CS-{N}', category: 'Пилы', basePrice: 13000 },
      { name: 'Электролобзик P.I.T. PJS-{N}', category: 'Пилы', basePrice: 5500 },
      
      // Другие инструменты
      { name: 'Рубанок DCK EP-{N}', category: 'Рубанки', basePrice: 9500 },
      { name: 'Фрезер DCK OF-{N}', category: 'Фрезеры', basePrice: 15500 },
      { name: 'Миксер строительный DCK MX-{N}', category: 'Миксеры', basePrice: 10500 },
      { name: 'Генератор DCK GG-{N}00', category: 'Генераторы', basePrice: 25000 },
      { name: 'Компрессор DCK AC-{N}', category: 'Компрессоры', basePrice: 18000 }
    ];
    
    let productCount = 0;
    let errorCount = 0;
    
    // Генерируем товары с вариациями
    for (const template of productTemplates) {
      for (let n = 1; n <= 15; n++) {
        try {
          const variations = [
            { N: (500 + n * 50).toString(), M: (n + 1).toString() },
            { N: (800 + n * 100).toString(), M: (n + 2).toString() },
            { N: (1200 + n * 150).toString(), M: (n + 3).toString() }
          ];
          
          for (const variation of variations) {
            try {
              const productName = template.name
                .replace('{N}', variation.N)
                .replace('{M}', variation.M);
              
              const sku = `DCK-${productName.split(' ')[1]}-${variation.N}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              
              // Получаем ID категории
              const categoryId = categoryMap.get(template.category) || 1;
              
              // Создаем товар
              const productData: ProductInput = {
                sku: sku,
                name: productName,
                slug: generateSlug(productName + '-' + sku),
                description: `Профессиональный инструмент ${productName}. Высокое качество и надежность.`,
                shortDescription: template.category,
                price: template.basePrice + Math.floor(Math.random() * 5000),
                originalPrice: null,
                imageUrl: generateProductImage(productName),
                stock: Math.floor(Math.random() * 100) + 20,
                categoryId: categoryId,
                isActive: true,
                isFeatured: Math.random() > 0.8,
                tag: null
              };
              
              await storage.createProduct(productData);
              productCount++;
              
              if (productCount % 50 === 0) {
                console.log(`📦 Создано ${productCount} товаров...`);
              }
              
            } catch (error: any) {
              if (!error.message.includes('duplicate key')) {
                errorCount++;
              }
            }
          }
        } catch (error: any) {
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 Быстрое массовое добавление завершено!');
    console.log(`📦 Товаров создано: ${productCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message);
  }
}

// Запускаем быстрое массовое добавление
quickMassImport()
  .then(() => {
    console.log('✅ Быстрое добавление завершено!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });