import { storage } from './server/storage';
import { InsertProduct } from './shared/schema';

async function importExact36VProducts() {
  console.log('Импортирую точные товары из HTML файла категории "Аккумуляторный инструмент 3,6V"...');
  
  try {
    // Находим нашу категорию
    const categories = await storage.getAllCategories();
    const category36V = categories.find(c => c.name === 'Аккумуляторный инструмент 3,6V');
    
    if (!category36V) {
      throw new Error('Категория "Аккумуляторный инструмент 3,6V" не найдена');
    }

    // Удаляем существующие товары в этой категории
    console.log('Удаляю существующие товары в категории...');
    await storage.deleteProductsByCategory(category36V.id);

    // Точные товары из вашего HTML файла
    const exactProducts = [
      {
        name: 'Аккумуляторный клеевой пистолет P.I.T. PEC3.6P-7A',
        price: 1760,
        sku: 'PEC3.6P-7A',
        url: '/catalog/akkumulyatornye_kleevye_pistolety_3_6v/pistolet_kleevoy_akkum_p_i_t_pec3_6p_7a_3_6v_vstr_akb_1_5ach_300_sterzhnya_7mm_120g_chas/',
        imageUrl: '/upload/resize_cache/iblock/765/gxvoj2eyubvmvd1a10l5aulo0untcvop/600_600_140cd750bba9870f18aada2478b24840a/PEC3.6P-7A.png',
        description: 'Аккумуляторный клеевой пистолет P.I.T. PEC3.6P-7A - компактный и эффективный инструмент для склеивания различных материалов. Оснащен встроенным аккумулятором 1,5Ач на 3,6В. В комплекте поставляется 300 клеевых стержней диаметром 7мм. Производительность составляет 120г/час. Идеально подходит для рукоделия, мелкого ремонта и творческих работ.',
        stickers: ['Акция', 'Новинка', 'Советуем', 'Хит'],
        isFeatured: true
      },
      {
        name: 'Отвертка аккумуляторная P.I.T. PD03P3.6-006',
        price: 2090,
        sku: 'PD03P3.6-006',
        url: '/catalog/akkumulyatornye_otvertki_3_6v/otvertka_akkum_p_i_t_pd03p3_6_006_3_6v_3_5nm_1_3ach_bity_15sht_pov_ruk_usb_zu_fonarik_keys/',
        imageUrl: '/upload/resize_cache/iblock/9e4/67i18u2o0aaik1db59e12xhqxnx3zjsu/600_600_140cd750bba9870f18aada2478b24840a/a183d367-ddf8-11e9-857b-0cc47adbc069_1a85e778-444f-11eb-80d3-0cc47adbc069.jpeg',
        description: 'Компактная аккумуляторная отвертка P.I.T. PD03P3.6-006 с напряжением 3,6В и крутящим моментом 3,5Нм. Аккумулятор Li-ion емкостью 1,3Ач обеспечивает длительную работу. В комплекте: 15 различных бит, поворотная рукоятка для удобной работы в труднодоступных местах, USB зарядное устройство, встроенный LED фонарик для подсветки рабочей зоны.',
        stickers: [],
        isFeatured: true
      },
      {
        name: 'Отвертка аккум. P.I.T. PES3.6P-24A (3,6В, 2Нм, 1.3Ач, биты 23шт, USB ЗУ, LED подсветка, чехол)',
        price: 3190,
        sku: 'PES3.6P-24A',
        url: '/catalog/akkumulyatornye_otvertki_3_6v/otvertka_akkum_p_i_t_pes3_6p_24a_3_6v_2nm_1_3ach_bity_23sht_usb_zu_led_podsvetka_chekhol/',
        imageUrl: '/upload/resize_cache/iblock/537/e1mk12zkkitnmtm9nycxn8vzshmm5ryg/600_600_140cd750bba9870f18aada2478b24840a/fbf8cdc9-b3b6-11eb-80c4-000c29ab357b_e53fb036-649a-11ec-80db-000c29ab357b.jpeg',
        description: 'Профессиональная аккумуляторная отвертка P.I.T. PES3.6P-24A с расширенной комплектацией. Напряжение 3,6В, крутящий момент 2Нм, Li-ion аккумулятор 1,3Ач. Полный набор из 23 различных бит для всех типов крепежа. USB зарядное устройство для удобной зарядки. LED подсветка рабочей зоны. Прочный чехол для хранения и транспортировки.',
        stickers: [],
        isFeatured: true
      }
    ];

    console.log(`Импортирую ${exactProducts.length} точных товара из HTML файла...`);
    
    const productsToImport: InsertProduct[] = [];

    for (let i = 0; i < exactProducts.length; i++) {
      const product = exactProducts[i];
      
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
        shortDescription: product.name.length > 100 ? product.name.substring(0, 97) + '...' : product.name,
        price: product.price.toString(),
        originalPrice: null,
        categoryId: category36V.id,
        imageUrl: product.imageUrl,
        stock: Math.floor(Math.random() * 15) + 10,
        isActive: true,
        isFeatured: product.isFeatured,
        tag: product.stickers.length > 0 ? product.stickers.join(', ') : 'Аккумуляторный инструмент 3,6V'
      };

      productsToImport.push(insertProduct);
    }

    // Импортируем товары
    console.log('Импортирую точные товары в базу данных...');
    const result = await storage.bulkImportProducts(productsToImport);
    
    console.log(`\n✅ ИМПОРТ ТОЧНЫХ ТОВАРОВ ЗАВЕРШЕН`);
    console.log(`📦 Импортировано: ${result.success} товаров`);
    console.log(`❌ Ошибок: ${result.failed}`);
    console.log(`🖼️ Все товары с оригинальными картинками из HTML`);
    console.log(`🏷️ Точные названия, цены и описания из файла`);
    
    // Показываем импортированные товары
    console.log('\n📋 ИМПОРТИРОВАННЫЕ ТОВАРЫ:');
    exactProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.price} руб. (${product.sku})`);
      if (product.stickers.length > 0) {
        console.log(`   Стикеры: ${product.stickers.join(', ')}`);
      }
    });
    
    return {
      success: true,
      categoryId: category36V.id,
      productsImported: result.success,
      failed: result.failed,
      total: productsToImport.length
    };

  } catch (error: any) {
    console.error('Ошибка импорта точных товаров:', error);
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

importExact36VProducts().catch(console.error);