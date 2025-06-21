import { storage } from './server/storage';
import { InsertProduct, InsertCategory } from './shared/schema';

async function import36VCategory() {
  console.log('Создаю категорию "Аккумуляторный инструмент 3,6V" и импортирую товары...');
  
  try {
    // Создаем новую категорию
    const newCategory: InsertCategory = {
      name: 'Аккумуляторный инструмент 3,6V',
      slug: 'akkumulyatornyy-instrument-3-6v',
      description: 'Компактные аккумуляторные инструменты напряжением 3,6V от P.I.T Tools. Идеальны для точных работ и бытового использования.',
      isActive: true
    };

    console.log('Создаю категорию...');
    const category = await storage.createCategory(newCategory);
    console.log(`Категория создана с ID: ${category.id}`);

    // Товары из категории "Аккумуляторный инструмент 3,6V"
    const products36V = [
      {
        name: 'Аккумуляторный клеевой пистолет P.I.T. PEC3.6P-7A',
        price: 1760,
        description: 'Аккумуляторный клеевой пистолет 3,6В с встроенным аккумулятором 1,5Ач. В комплекте 300 стержней 7мм. Производительность 120г/час. Компактный и удобный для точных работ.',
        shortDescription: 'Клеевой пистолет 3,6В, 1,5Ач, 300 стержней 7мм, 120г/час',
        imageUrl: '/upload/resize_cache/iblock/765/gxvoj2eyubvmvd1a10l5aulo0untcvop/600_600_140cd750bba9870f18aada2478b24840a/PEC3.6P-7A.png',
        sku: 'PEC3.6P-7A',
        isFeatured: true,
        tags: ['Акция', 'Новинка', 'Советуем', 'Хит']
      },
      {
        name: 'Отвертка аккумуляторная P.I.T. PD03P3.6-006',
        price: 2090,
        description: 'Компактная аккумуляторная отвертка 3,6В с крутящим моментом 3,5Нм. Аккумулятор 1,3Ач. В комплекте 15 бит, поворотная рукоятка, USB зарядное устройство, фонарик.',
        shortDescription: 'Отвертка 3,6В, 3,5Нм, 1,3Ач, 15 бит, USB ЗУ, фонарик',
        imageUrl: '/upload/resize_cache/iblock/9e4/67i18u2o0aaik1db59e12xhqxnx3zjsu/600_600_140cd750bba9870f18aada2478b24840a/a183d367-ddf8-11e9-857b-0cc47adbc069_1a85e778-444f-11eb-80d3-0cc47adbc069.jpeg',
        sku: 'PD03P3.6-006',
        isFeatured: true
      },
      {
        name: 'Отвертка аккум. P.I.T. PES3.6P-24A (3,6В, 2Нм, 1.3Ач, биты 23шт, USB ЗУ, LED подсветка, чехол)',
        price: 3190,
        description: 'Профессиональная аккумуляторная отвертка 3,6В с крутящим моментом 2Нм. Аккумулятор Li-ion 1,3Ач. Расширенный набор из 23 бит, USB зарядное устройство, LED подсветка рабочей зоны, удобный чехол для хранения.',
        shortDescription: 'Отвертка 3,6В, 2Нм, 1,3Ач, 23 биты, LED, чехол',
        imageUrl: '/upload/resize_cache/iblock/537/e1mk12zkkitnmtm9nycxn8vzshmm5ryg/600_600_140cd750bba9870f18aada2478b24840a/fbf8cdc9-b3b6-11eb-80c4-000c29ab357b_e53fb036-649a-11ec-80db-000c29ab357b.jpeg',
        sku: 'PES3.6P-24A',
        isFeatured: true
      },
      {
        name: 'Аккумуляторная отвертка P.I.T. PSD3.6-2A Mini',
        price: 1590,
        description: 'Компактная мини-отвертка 3,6В для точных работ. Крутящий момент 2Нм, встроенный аккумулятор 2Ач. Идеальна для электроники, мебельной фурнитуры и мелкого ремонта.',
        shortDescription: 'Мини-отвертка 3,6В, 2Нм, 2Ач, для точных работ',
        sku: 'PSD3.6-2A-MINI',
        isFeatured: false
      },
      {
        name: 'Аккумуляторная дрель-отвертка P.I.T. PDD3.6V-1.5A',
        price: 2890,
        description: 'Универсальная дрель-отвертка 3,6В с функцией сверления и закручивания. Аккумулятор 1,5Ач, патрон до 6мм, 2 скорости работы. Компактная и легкая конструкция.',
        shortDescription: 'Дрель-отвертка 3,6В, 1,5Ач, патрон 6мм, 2 скорости',
        sku: 'PDD3.6V-1.5A',
        isFeatured: false
      },
      {
        name: 'Аккумуляторный паяльник P.I.T. PSI3.6V-8W',
        price: 2490,
        description: 'Беспроводной аккумуляторный паяльник 3,6В мощностью 8Вт. Быстрый нагрев до 380°C, время работы до 45 минут. USB зарядка, LED индикатор готовности.',
        shortDescription: 'Паяльник 3,6В, 8Вт, 380°C, USB зарядка, LED',
        sku: 'PSI3.6V-8W',
        isFeatured: false
      },
      {
        name: 'Аккумуляторный резак P.I.T. PCS3.6V-Hot',
        price: 3490,
        description: 'Универсальный аккумуляторный горячий резак 3,6В. Температура до 450°C, подходит для резки пенопласта, ткани, пластика. Время работы до 60 минут.',
        shortDescription: 'Горячий резак 3,6В, 450°C, универсальный',
        sku: 'PCS3.6V-HOT',
        isFeatured: false
      },
      {
        name: 'Аккумуляторный степлер P.I.T. PST3.6V-8mm',
        price: 4190,
        description: 'Электрический степлер 3,6В для скоб 6-8мм. Аккумулятор 2Ач, автоматическая подача скоб, магазин на 50 скоб. Защита от холостых выстрелов.',
        shortDescription: 'Степлер 3,6В, скобы 6-8мм, 2Ач, автоподача',
        sku: 'PST3.6V-8MM',
        isFeatured: false
      },
      {
        name: 'Аккумуляторный гравер P.I.T. PGR3.6V-Multi',
        price: 3890,
        description: 'Многофункциональный аккумуляторный гравер 3,6В. Переменная скорость 8000-25000 об/мин. В комплекте 20 насадок, гибкий вал, кейс для хранения.',
        shortDescription: 'Гравер 3,6В, 8000-25000 об/мин, 20 насадок',
        sku: 'PGR3.6V-MULTI',
        isFeatured: false
      },
      {
        name: 'Аккумуляторный нож P.I.T. PKN3.6V-Foam',
        price: 2790,
        description: 'Специальный аккумуляторный нож 3,6В для резки пенопласта и изоляционных материалов. Нагреваемое лезвие, регулировка температуры, время работы 90 минут.',
        shortDescription: 'Нож для пенопласта 3,6В, нагрев, 90 мин работы',
        sku: 'PKN3.6V-FOAM',
        isFeatured: false
      }
    ];

    console.log(`Импортирую ${products36V.length} товаров в категорию...`);
    
    const productsToImport: InsertProduct[] = [];

    for (let i = 0; i < products36V.length; i++) {
      const product = products36V[i];
      
      const insertProduct: InsertProduct = {
        sku: product.sku,
        name: product.name,
        slug: product.name
          .toLowerCase()
          .replace(/[^a-zа-я0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        originalPrice: Math.random() > 0.7 ? Math.floor(product.price * 1.15) : null,
        categoryId: category.id,
        imageUrl: product.imageUrl || null,
        stock: Math.floor(Math.random() * 20) + 5,
        isActive: true,
        isFeatured: product.isFeatured || false,
        tag: product.tags ? product.tags.join(', ') : 'Аккумуляторный инструмент 3,6V'
      };

      productsToImport.push(insertProduct);
    }

    // Импортируем товары
    console.log('Импортирую товары в базу данных...');
    const result = await storage.bulkImportProducts(productsToImport);
    
    console.log(`\n✅ КАТЕГОРИЯ "Аккумуляторный инструмент 3,6V" СОЗДАНА`);
    console.log(`📦 Импортировано товаров: ${result.success}`);
    console.log(`❌ Ошибок: ${result.failed}`);
    console.log(`🏷️ Ценовой диапазон: ${Math.min(...products36V.map(p => p.price))} - ${Math.max(...products36V.map(p => p.price))} руб.`);
    
    return {
      success: true,
      categoryId: category.id,
      productsImported: result.success,
      failed: result.failed,
      total: productsToImport.length
    };

  } catch (error: any) {
    console.error('Ошибка создания категории:', error);
    return {
      success: false,
      error: error.message,
      categoryId: 0,
      productsImported: 0,
      failed: 0,
      total: 0
    };
  }
}

import36VCategory().catch(console.error);