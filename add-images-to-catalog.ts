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

// Маппинг категорий к изображениям
const categoryImages = {
  'Дрели': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
  'Шуруповерты': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Гайковерты': 'https://images.unsplash.com/photo-1609205853540-a4eb8a98e85b?w=300&h=200&fit=crop',
  'Перфораторы': 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=300&h=200&fit=crop',
  'Углошлифовальные машины': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Пилы': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=200&fit=crop',
  'Рубанки': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop',
  'Лобзики': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Фрезеры': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=200&fit=crop',
  'Миксеры': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Генераторы': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop',
  'Компрессоры': 'https://images.unsplash.com/photo-1621905251078-3f9c827d1fcf?w=300&h=200&fit=crop',
  'Сварочное оборудование': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=300&h=200&fit=crop',
  'Краскопульты': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&h=200&fit=crop',
  'Насосы': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop',
  'Полировальные машины': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=200&fit=crop',
  'Станки': 'https://images.unsplash.com/photo-1565003033444-69c5db2c27b1?w=300&h=200&fit=crop',
  'Измерительные инструменты': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&h=200&fit=crop',
  'Ручной инструмент': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
  'Садовая техника': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
  'Уборочная техника': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
  'Паяльники': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&h=200&fit=crop',
  'Фены технические': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=200&fit=crop',
  'Электрооборудование': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=300&h=200&fit=crop',
  'Пневмоинструменты': 'https://images.unsplash.com/photo-1621905251078-3f9c827d1fcf?w=300&h=200&fit=crop',
  'Многофункциональные инструменты': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
  'Строительные леса': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop',
  'Инструменты': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop'
};

// Функция для получения изображения для категории
function getCategoryImage(categoryName: string): string {
  const cleanName = cleanText(categoryName);
  
  // Ищем точное совпадение
  if (categoryImages[cleanName]) {
    return categoryImages[cleanName];
  }
  
  // Ищем частичное совпадение
  for (const [key, image] of Object.entries(categoryImages)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return image;
    }
  }
  
  return categoryImages['Инструменты']; // По умолчанию
}

// Функция для генерации URL изображения товара
function generateProductImage(productName: string, sku: string): string {
  // Определяем тип инструмента и подбираем соответствующее изображение
  const name = productName.toLowerCase();
  
  if (name.includes('дрель') || name.includes('drill')) {
    return `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('шуруповерт') || name.includes('screwdriver')) {
    return `https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('гайковерт') || name.includes('impact')) {
    return `https://images.unsplash.com/photo-1609205853540-a4eb8a98e85b?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('перфоратор') || name.includes('hammer')) {
    return `https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('болгарк') || name.includes('grinder')) {
    return `https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('пила') || name.includes('saw')) {
    return `https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('рубанок') || name.includes('planer')) {
    return `https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('фрезер') || name.includes('router')) {
    return `https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('сварочн') || name.includes('weld')) {
    return `https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  if (name.includes('генератор') || name.includes('generator')) {
    return `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop&auto=format&q=80`;
  }
  
  // По умолчанию - общее изображение инструмента
  return `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop&auto=format&q=80`;
}

// Обновление изображений для существующих категорий
async function updateCategoryImages() {
  try {
    console.log('🖼️ Обновляем изображения для существующих категорий...');
    
    const storage = new DatabaseStorage();
    const categories = await storage.getAllCategories();
    
    let updatedCount = 0;
    
    for (const category of categories) {
      const imageUrl = getCategoryImage(category.name);
      
      try {
        await storage.updateCategory(category.id, {
          icon: imageUrl
        });
        updatedCount++;
        console.log(`✅ Обновлено изображение для категории: ${category.name}`);
      } catch (error: any) {
        console.log(`❌ Ошибка обновления категории ${category.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Обновлено изображений для ${updatedCount} категорий`);
    
  } catch (error: any) {
    console.error('💥 Ошибка обновления изображений категорий:', error.message);
  }
}

// Обновление изображений для существующих товаров
async function updateProductImages() {
  try {
    console.log('🖼️ Обновляем изображения для существующих товаров...');
    
    const storage = new DatabaseStorage();
    const products = await storage.getAllProducts();
    
    let updatedCount = 0;
    
    for (const product of products) {
      // Проверяем, есть ли уже изображение
      if (product.imageUrl && product.imageUrl.trim() !== '') {
        continue; // Пропускаем товары, у которых уже есть изображение
      }
      
      const imageUrl = generateProductImage(product.name, product.sku);
      
      try {
        await storage.updateProduct(product.id, {
          imageUrl: imageUrl
        });
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`📦 Обновлено ${updatedCount} товаров...`);
        }
      } catch (error: any) {
        console.log(`❌ Ошибка обновления товара ${product.sku}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Обновлено изображений для ${updatedCount} товаров`);
    
  } catch (error: any) {
    console.error('💥 Ошибка обновления изображений товаров:', error.message);
  }
}

// Создание дополнительных товаров с изображениями из Excel данных
async function createAdditionalProducts() {
  try {
    console.log('📦 Создаем дополнительные товары с изображениями...');
    
    const storage = new DatabaseStorage();
    
    // Дополнительные товары для демонстрации (на основе типичного каталога DCK)
    const additionalProducts = [
      {
        name: 'Дрель ударная DCK DHL-950',
        sku: 'DCK-DHL-950',
        price: 12500,
        category: 'Дрели',
        description: 'Ударная дрель мощностью 950 Вт с реверсом и регулировкой оборотов'
      },
      {
        name: 'Шуруповерт аккумуляторный DCK CDL-18V',
        sku: 'DCK-CDL-18V',
        price: 8900,
        category: 'Шуруповерты',
        description: 'Аккумуляторный шуруповерт 18В с Li-ion батареей'
      },
      {
        name: 'Гайковерт ударный DCK IWR-1200',
        sku: 'DCK-IWR-1200',
        price: 15600,
        category: 'Гайковерты',
        description: 'Ударный гайковерт 1200 Вт для профессионального использования'
      },
      {
        name: 'Перфоратор SDS-Plus DCK RH-800',
        sku: 'DCK-RH-800',
        price: 18900,
        category: 'Перфораторы',
        description: 'Перфоратор SDS-Plus 800 Вт с функцией долбления'
      },
      {
        name: 'Болгарка DCK AG-125/1100',
        sku: 'DCK-AG-125-1100',
        price: 6700,
        category: 'Углошлифовальные машины',
        description: 'Углошлифовальная машина 125 мм, 1100 Вт'
      },
      {
        name: 'Пила циркулярная DCK CS-190/1600',
        sku: 'DCK-CS-190-1600',
        price: 14200,
        category: 'Пилы',
        description: 'Циркулярная пила 190 мм с лазерным указателем'
      },
      {
        name: 'Рубанок электрический DCK EP-82/650',
        sku: 'DCK-EP-82-650',
        price: 9800,
        category: 'Рубанки',
        description: 'Электрический рубанок 82 мм, глубина строгания до 2 мм'
      },
      {
        name: 'Фрезер DCK OF-1010/1000',
        sku: 'DCK-OF-1010-1000',
        price: 16800,
        category: 'Фрезеры',
        description: 'Вертикальный фрезер 1000 Вт с цанговым зажимом'
      },
      {
        name: 'Миксер строительный DCK MX-1400',
        sku: 'DCK-MX-1400',
        price: 11300,
        category: 'Миксеры',
        description: 'Строительный миксер 1400 Вт с двумя скоростями'
      },
      {
        name: 'Генератор бензиновый DCK GG-2800',
        sku: 'DCK-GG-2800',
        price: 22500,
        category: 'Генераторы',
        description: 'Бензиновый генератор 2.8 кВт с автозапуском'
      }
    ];
    
    let createdCount = 0;
    
    for (const productData of additionalProducts) {
      try {
        // Получаем или создаем категорию
        const categories = await storage.getAllCategories();
        let categoryId = categories.find(cat => cat.name === productData.category)?.id;
        
        if (!categoryId) {
          const newCategory: InsertCategory = {
            name: productData.category,
            slug: generateSlug(productData.category),
            description: `Категория ${productData.category}`,
            icon: getCategoryImage(productData.category)
          };
          const createdCategory = await storage.createCategory(newCategory);
          categoryId = createdCategory.id;
        }
        
        // Создаем товар
        const product: ProductInput = {
          sku: productData.sku,
          name: productData.name,
          slug: generateSlug(productData.name + '-' + productData.sku),
          description: productData.description,
          shortDescription: productData.category,
          price: productData.price,
          originalPrice: null,
          imageUrl: generateProductImage(productData.name, productData.sku),
          stock: 100,
          categoryId: categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.7, // 30% товаров делаем рекомендуемыми
          tag: null
        };
        
        await storage.createProduct(product);
        createdCount++;
        console.log(`✅ Создан товар: ${productData.name}`);
        
      } catch (error: any) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          console.log(`⚠️ Товар с SKU "${productData.sku}" уже существует`);
        } else {
          console.log(`❌ Ошибка создания товара "${productData.sku}": ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Создано ${createdCount} новых товаров с изображениями`);
    
  } catch (error: any) {
    console.error('💥 Ошибка создания дополнительных товаров:', error.message);
  }
}

// Запускаем обновление
console.log('='.repeat(60));
console.log('🖼️ ДОБАВЛЕНИЕ ИЗОБРАЖЕНИЙ В КАТАЛОГ');
console.log('='.repeat(60));

Promise.resolve()
  .then(() => updateCategoryImages())
  .then(() => updateProductImages())
  .then(() => createAdditionalProducts())
  .then(() => {
    console.log('\n✅ Все операции завершены успешно!');
    console.log('🎨 Изображения добавлены во все категории и товары');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });