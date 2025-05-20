import * as fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";
import { parseString } from "xml2js";

// Расширенный тип для работы с импортом
interface ImportProduct extends Partial<InsertProduct> {
  categoryName?: string;
}

/**
 * Парсит файл CSV, JSON или XML и возвращает массив данных товаров
 */
export async function parseImportFile(filePath: string, fileExtension: string): Promise<ImportProduct[]> {
  try {
    // Выводим тип файла для диагностики
    console.log(`Обработка файла с расширением: ${fileExtension}`);
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Выводим небольшой фрагмент содержимого для диагностики
    console.log(`Первые 200 символов файла: ${fileContent.substring(0, 200)}`);
    
    if (fileExtension === '.json') {
      return parseJsonFile(fileContent);
    } else if (fileExtension === '.csv') {
      return parseCsvFile(fileContent);
    } else if (fileExtension === '.xml') {
      try {
        console.log("Начинаем разбор XML файла...");
        return await parseXmlFile(fileContent);
      } catch (xmlError: any) {
        console.error("XML parsing error:", xmlError);
        throw new Error(`Ошибка при разборе XML: ${xmlError.message}`);
      }
    } else {
      throw new Error('Неподдерживаемый формат файла. Пожалуйста, используйте CSV, JSON или XML.');
    }
  } catch (error: any) {
    console.error("File parsing error:", error);
    throw new Error(`Ошибка при разборе файла: ${error.message}`);
  }
}

/**
 * Парсит содержимое JSON-файла в данные о товарах
 */
function parseJsonFile(content: string): ImportProduct[] {
  try {
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON файл должен содержать массив товаров');
    }
    
    return data.map(item => {
      // Обязательные поля
      if (!item.name || !item.price) {
        throw new Error('Каждый товар должен иметь как минимум название и цену');
      }
      
      // Генерация slug, если не указан
      if (!item.slug && item.name) {
        const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
        item.slug = item.name
          .toLowerCase()
          .replace(cyrillicPattern, '')
          .replace(/\s+/g, '-');
      }
      
      return item;
    });
  } catch (error: any) {
    throw new Error(`Некорректный формат JSON: ${error.message}`);
  }
}

/**
 * Парсит содержимое CSV-файла в данные о товарах
 */
function parseCsvFile(content: string): ImportProduct[] {
  try {
    // Парсим CSV-файл с заголовками
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return records.map((record: any) => {
      // Конвертируем строковые значения в соответствующие типы
      const product: ImportProduct = {};
      
      // Обязательные поля
      if (!record.name || !record.price) {
        throw new Error('Каждый товар должен иметь как минимум название и цену');
      }
      
      // Маппинг полей с преобразованием типов
      product.name = record.name;
      product.price = parseFloat(record.price).toString();
      
      // Опциональные поля
      if (record.sku) product.sku = record.sku;
      if (record.description) product.description = record.description;
      if (record.shortDescription) product.shortDescription = record.shortDescription;
      if (record.imageUrl) product.imageUrl = record.imageUrl;
      if (record.categoryId) product.categoryId = parseInt(record.categoryId, 10);
      if (record.originalPrice) product.originalPrice = parseFloat(record.originalPrice).toString();
      if (record.stock) product.stock = parseInt(record.stock, 10);
      if (record.isActive) product.isActive = record.isActive.toLowerCase() === 'true';
      if (record.isFeatured) product.isFeatured = record.isFeatured.toLowerCase() === 'true';
      if (record.slug) product.slug = record.slug;
      else if (product.name) {
        // Генерация slug из названия
        const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
        product.slug = product.name
          .toLowerCase()
          .replace(cyrillicPattern, '')
          .replace(/\s+/g, '-');
      }
      
      return product;
    });
  } catch (error: any) {
    throw new Error(`Некорректный формат CSV: ${error.message}`);
  }
}

/**
 * Парсит содержимое XML-файла в данные о товарах
 */
async function parseXmlFile(content: string): Promise<ImportProduct[]> {
  try {
    // Очищаем текст от BOM
    const cleanContent = content.replace(/^\uFEFF/, '');
    
    // Для отладки только просматриваем наличие XML-деклараций
    const hasXmlDeclaration = content.startsWith('<?xml');
    const hasDoctypeDeclaration = content.includes('<!DOCTYPE');
    
    console.log("XML файл содержит декларацию XML:", hasXmlDeclaration);
    console.log("XML файл содержит декларацию DOCTYPE:", hasDoctypeDeclaration);
    
    // Выводим начало XML для диагностики
    console.log("Начало XML файла:", cleanContent.substring(0, 200));
    
    // Создаем промис вручную для парсинга XML
    const result = await new Promise<any>((resolve, reject) => {
      parseString(content, {
        explicitArray: false, // Не преобразовывать одиночные элементы в массивы
        normalizeTags: true, // Приводим теги к нижнему регистру для единообразия
        trim: true, // Удалять лишние пробелы
        strict: false, // Отключаем строгую проверку XML
        mergeAttrs: true, // Объединяем атрибуты и элементы для упрощения доступа
        attrNameProcessors: [(name: string) => name.toLowerCase()], // Приводим имена атрибутов к нижнему регистру
        tagNameProcessors: [(name: string) => name.toLowerCase()] // Приводим имена тегов к нижнему регистру
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  
    console.log("Результат парсинга XML:", JSON.stringify(result, null, 2).substring(0, 500) + "...");
  
    if (!result) {
      throw new Error('XML файл не может быть прочитан');
    }
    
    // Обработка различных форматов XML
    // Проверяем наличие разных корневых элементов
    const ymlCatalog = result.yml_catalog;
    
    // Добавляем отладочный вывод для просмотра структуры
    console.log("Доступные корневые элементы:", Object.keys(result));
    
    // Более подробное логирование структуры для анализа формата ПРОСВАР.xml
    const resultKeys = Object.keys(result);
    if (resultKeys.length > 0) {
      const firstKey = resultKeys[0];
      if (result[firstKey]) {
        console.log(`Структура первого элемента "${firstKey}":`, Object.keys(result[firstKey]));
      }
    }
    
    if (ymlCatalog) {
      console.log("Обнаружен формат YML-каталога");
      
      // Убедимся, что shop существует
      if (!ymlCatalog.shop) {
        throw new Error('XML файл не содержит элемента shop в формате YML');
      }
      
      const shop = ymlCatalog.shop;
      
      // Проверяем наличие offers в разных форматах XML
      if (!shop.offers) {
        throw new Error('XML файл не содержит элемента offers в формате YML');
      }
      
      // Проверка на существование offer (может быть массивом или одиночным объектом)
      if (!shop.offers.offer) {
        throw new Error('XML файл не содержит элементов offer в формате YML');
      }
      
      // Обрабатываем категории, если они есть
      const categoriesMap: Record<string, {id: number, name: string}> = {};
      
      if (shop.categories && shop.categories.category) {
        // Получаем список категорий, убедитесь, что это массив
        const categoryItems = Array.isArray(shop.categories.category) 
          ? shop.categories.category 
          : [shop.categories.category];
        
        // Проходим по всем категориям
        categoryItems.forEach((cat: any) => {
          // Категория может иметь несколько форматов, обрабатываем все
          // Возможные форматы: 
          // 1. {id: "1", _: "Название"} 
          // 2. {id: "1", _value: "Название"} 
          // 3. {id: "1", $: {id: "1"}, _: "Название"}
          // 4. {id: "1", name: "Название"}
          
          let categoryId: string | undefined;
          let categoryName: string | undefined;
          
          // Получаем ID категории
          if (cat.id) {
            categoryId = cat.id.toString();
          } else if (cat.$ && cat.$.id) {
            categoryId = cat.$.id.toString();
          }
          
          // Получаем название категории
          if (cat._) {
            categoryName = cat._.toString();
          } else if (cat._value) {
            categoryName = cat._value.toString();
          } else if (cat.name) {
            categoryName = cat.name.toString();
          } else if (typeof cat === 'string') {
            categoryName = cat;
          }
          
          // Если нашли и ID, и название - добавляем в карту
          if (categoryId && categoryName) {
            categoriesMap[categoryId] = {
              id: Number(categoryId),
              name: categoryName
            };
          }
        });
      }
      
      // Получаем список товаров
      const offers = Array.isArray(shop.offers.offer)
        ? shop.offers.offer
        : [shop.offers.offer];
      
      // Преобразуем каждый товар
      return offers.map((offer: any, index: number) => {
        const product: ImportProduct = {};
        
        // Получаем название товара из разных возможных полей
        if (offer.name) product.name = offer.name;
        else if (offer.n) product.name = offer.n;
        else if (offer._) product.name = offer._;
        else if (offer.model) product.name = offer.model;
        
        // Если нет имени, пропускаем этот товар
        if (!product.name) {
          console.warn(`Товар #${index} пропущен - отсутствует название`);
          return null;
        }
        
        // Формируем SKU из имени, если нет ID
        if (offer.id) {
          product.sku = offer.id.toString();
        } else if (offer.n) {
          // Генерация SKU из названия
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          product.sku = `SKU-${randomPart}`;
        } else if (product.name) {
          // Генерация SKU из названия с добавлением уникального идентификатора
          const cleanedName = product.name
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Zа-яА-ЯёЁ0-9-]/g, '')
            .substring(0, 10);
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          product.sku = `${cleanedName}-${randomPart}`;
        }
        
        // Парсим другие поля
        if (offer.description) product.description = offer.description;
        if (offer.price) product.price = parseFloat(offer.price).toString();
        if (offer.oldprice) product.originalPrice = parseFloat(offer.oldprice).toString();
        if (offer.picture) product.imageUrl = offer.picture;
        // Обрабатываем ID категории, который может быть в разных местах
        let categoryId: string | undefined;
        
        if (offer.categoryId) {
          categoryId = offer.categoryId.toString();
        } else if (offer.categoryid) {
          categoryId = offer.categoryid.toString();
        } else if (offer.categoryID) {
          categoryId = offer.categoryID.toString();
        } else if (offer.category_id) {
          categoryId = offer.category_id.toString();
        }
        
        // Если у нас есть ID категории и она существует в нашей карте
        if (categoryId && categoriesMap[categoryId]) {
          product.categoryId = categoriesMap[categoryId].id;
          // Сохраняем название категории для автоматического создания
          product.categoryName = categoriesMap[categoryId].name;
        } else {
          // Если категория не найдена, но ID есть - сохраняем его для автоматического создания
          if (categoryId) {
            product.categoryId = Number(categoryId);
            product.categoryName = `Категория ${categoryId}`;
          } else {
            // Используем категорию по умолчанию, если не указана
            product.categoryId = 1;
          }
        }
        
        // Статус доступности
        if (offer.available) {
          product.isActive = offer.available.toLowerCase() === 'true';
          product.stock = product.isActive ? 100 : 0; // Примерное значение для наличия
        } else {
          // По умолчанию товар активен и в наличии
          product.isActive = true;
          product.stock = 100;
        }
        
        // Доп. характеристики
        // Параметры сохраняем в shortDescription в формате строки
        if (offer.param && Array.isArray(offer.param)) {
          const specs: Record<string, string> = {};
          offer.param.forEach((param: any) => {
            if (param.name && param._) {
              specs[param.name] = param._;
            }
          });
          if (Object.keys(specs).length > 0) {
            const specsArr = Object.entries(specs).map(([name, value]) => `${name}: ${value}`);
            product.shortDescription = specsArr.join(', ');
          }
        }
        
        // Создаем slug из названия
        if (product.name) {
          const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
          product.slug = product.name
            .toLowerCase()
            .replace(cyrillicPattern, '')
            .replace(/\s+/g, '-')
            .substring(0, 50); // Ограничиваем длину slug
            
          // Добавляем уникальный идентификатор к slug
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          product.slug = `${product.slug}-${randomPart}`;
        }
        
        return product;
      }).filter(Boolean) as ImportProduct[];
    } else if (result.PROSVAR || result.prosvar) {
      // Обработка файла в формате ПРОСВАР.xml
      console.log("Обнаружен ПРОСВАР формат XML. Применяю специальную обработку...");
      
      const prosvarRoot = result.PROSVAR || result.prosvar;
      console.log("Структура корневого элемента ПРОСВАР:", Object.keys(prosvarRoot));
      
      let productList: any[] = [];
      // Проверка на различные варианты структуры данных
      if (prosvarRoot.products && prosvarRoot.products.product) {
        productList = Array.isArray(prosvarRoot.products.product) 
          ? prosvarRoot.products.product 
          : [prosvarRoot.products.product];
        console.log(`Найдено ${productList.length} товаров в формате ПРОСВАР.products.product`);
      } else if (prosvarRoot.product) {
        productList = Array.isArray(prosvarRoot.product) 
          ? prosvarRoot.product 
          : [prosvarRoot.product];
        console.log(`Найдено ${productList.length} товаров в формате ПРОСВАР.product`);
      } else if (prosvarRoot.items && prosvarRoot.items.item) {
        productList = Array.isArray(prosvarRoot.items.item) 
          ? prosvarRoot.items.item 
          : [prosvarRoot.items.item];
        console.log(`Найдено ${productList.length} товаров в формате ПРОСВАР.items.item`);
      } else if (prosvarRoot.item) {
        productList = Array.isArray(prosvarRoot.item) 
          ? prosvarRoot.item 
          : [prosvarRoot.item];
        console.log(`Найдено ${productList.length} товаров в формате ПРОСВАР.item`);
      }
      
      // Обработка товаров в формате ПРОСВАР
      return productList.map((item: any, index: number) => {
        const product: ImportProduct = {};
        
        try {
          // Получаем ID товара
          if (item.id) product.sku = item.id.toString();
          else if (item.code) product.sku = item.code.toString();
          else {
            // Генерируем уникальный SKU
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            product.sku = `SKU-${randomPart}`;
          }
          
          // Получаем название товара
          if (item.name) product.name = item.name.toString();
          else if (item.title) product.name = item.title.toString();
          else {
            // Если нет имени, пропускаем
            console.warn(`Товар ПРОСВАР #${index} пропущен - отсутствует название`);
            return null;
          }
          
          // Получаем цену
          if (item.price) {
            if (typeof item.price === 'string') {
              // Заменяем запятую на точку и парсим
              product.price = parseFloat(item.price.replace(/,/g, '.')).toString();
            } else if (typeof item.price === 'number') {
              product.price = item.price.toString();
            }
          } else if (item.cost) {
            if (typeof item.cost === 'string') {
              product.price = parseFloat(item.cost.replace(/,/g, '.')).toString();
            } else if (typeof item.cost === 'number') {
              product.price = item.cost.toString();
            }
          } else {
            // Если нет цены, устанавливаем 0
            product.price = "0";
          }
          
          // Обрабатываем категории
          let categoryName: string | undefined;
          
          if (item.categoryname) categoryName = item.categoryname;
          else if (item.category) categoryName = item.category;
          else if (item.group) categoryName = item.group;
          
          if (categoryName) {
            product.categoryName = categoryName;
          } else {
            // Устанавливаем категорию по умолчанию
            product.categoryId = 1;
          }
          
          // Описание
          if (item.description) product.description = item.description;
          
          // Краткое описание
          if (item.shortdescription) product.shortDescription = item.shortdescription;
          else if (item.brief) product.shortDescription = item.brief;
          
          // Создаем slug из названия
          if (product.name) {
            const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
            product.slug = product.name
              .toLowerCase()
              .replace(cyrillicPattern, '')
              .replace(/\s+/g, '-')
              .substring(0, 50); // Ограничиваем длину slug
              
            // Добавляем уникальный идентификатор к slug
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            product.slug = `${product.slug}-${randomPart}`;
          }
          
          // Картинка
          if (item.picture) product.imageUrl = item.picture;
          else if (item.image) product.imageUrl = item.image;
          
          // По умолчанию товар активен
          product.isActive = true;
          
          return product;
        } catch (err: any) {
          console.error(`Ошибка при обработке товара ПРОСВАР #${index}:`, err);
          return null;
        }
      }).filter(Boolean) as ImportProduct[];
    } else if (result.base && result.base.items && result.base.items.item) {
      // Обработка специального формата для файла "ПРОСВАР.xml"
      console.log("Обнаружен формат Base с элементами Items/Item");
      
      // Получаем товары
      const items = Array.isArray(result.base.items.item) 
        ? result.base.items.item 
        : [result.base.items.item];
      
      console.log(`Найдено ${items.length} товаров в формате Base/Items/Item`);
      
      // Преобразуем товары
      return items.map((item: any, index: number) => {
        try {
          const product: ImportProduct = {};
          
          // ID товара
          if (item.id) product.sku = item.id.toString();
          else if (item.code) product.sku = item.code.toString();
          else {
            // Генерируем уникальный SKU
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            product.sku = `SKU-${randomPart}`;
          }
          
          // Название товара
          if (item.name) product.name = item.name.toString();
          else if (item.title) product.name = item.title.toString();
          else {
            // Если нет имени, пропускаем
            console.warn(`Товар Base/Items/Item #${index} пропущен - отсутствует название`);
            return null;
          }
          
          // Цена товара
          if (item.price) {
            if (typeof item.price === 'string') {
              // Заменяем запятую на точку и парсим
              product.price = parseFloat(item.price.replace(/,/g, '.')).toString();
            } else if (typeof item.price === 'number') {
              product.price = item.price.toString();
            }
          } else {
            // Если нет цены, устанавливаем 0
            product.price = "0";
          }
          
          // Описание
          if (item.description) product.description = item.description;
          
          // Категория
          if (item.group) product.categoryName = item.group;
          else if (item.category) product.categoryName = item.category;
          
          // Создаем slug из названия
          if (product.name) {
            const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
            product.slug = product.name
              .toLowerCase()
              .replace(cyrillicPattern, '')
              .replace(/\s+/g, '-')
              .substring(0, 50); // Ограничиваем длину slug
              
            // Добавляем уникальный идентификатор к slug
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            product.slug = `${product.slug}-${randomPart}`;
          }
          
          return product;
        } catch (err) {
          console.error(`Ошибка при обработке товара Base/Items/Item #${index}:`, err);
          return null;
        }
      }).filter(Boolean) as ImportProduct[];
    } else {
      // Если ни один известный формат не обнаружен, пытаемся найти товары в корневом элементе
      console.log("Неизвестный формат XML, пытаемся извлечь товары из корневого элемента...");
      
      const products: ImportProduct[] = [];
      
      // Функция для поиска элементов, которые могут быть товарами
      const findProducts = (obj: any, path: string = "") => {
        if (!obj || typeof obj !== 'object') return;
        
        // Проверяем, есть ли массивы товаров с типичными названиями
        const possibleProductArrays = [
          "items", "товары", "products", "offers", "goods", "product", "item", "offer",
          "элементы", "прайс", "price", "catalogue", "каталог"
        ];
        
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          
          // Если нашли массив, проверяем, содержит ли он товары
          if (Array.isArray(value)) {
            // Проверяем первый элемент массива
            if (value.length > 0 && typeof value[0] === 'object' && (
                value[0].name || value[0].title || value[0].id || value[0].price || value[0].code)) {
              console.log(`Найден массив товаров в пути ${path}/${key}`);
              
              // Преобразуем каждый элемент массива в товар
              value.forEach((item, index) => {
                try {
                  const product: ImportProduct = {};
                  
                  // ID товара
                  if (item.id) product.sku = item.id.toString();
                  else if (item.code) product.sku = item.code.toString();
                  else {
                    // Генерируем уникальный SKU
                    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    product.sku = `SKU-${randomPart}`;
                  }
                  
                  // Название товара
                  if (item.name) product.name = item.name.toString();
                  else if (item.title) product.name = item.title.toString();
                  else {
                    // Если нет имени, пропускаем
                    return;
                  }
                  
                  // Цена товара
                  if (item.price) {
                    if (typeof item.price === 'string') {
                      // Заменяем запятую на точку и парсим
                      product.price = parseFloat(item.price.replace(/,/g, '.')).toString();
                    } else if (typeof item.price === 'number') {
                      product.price = item.price.toString();
                    }
                  } else {
                    // Если нет цены, устанавливаем 0
                    product.price = "0";
                  }
                  
                  // Описание
                  if (item.description) product.description = item.description;
                  
                  // Категория
                  if (item.group) product.categoryName = item.group;
                  else if (item.category) product.categoryName = item.category;
                  else {
                    // Используем родительский элемент как категорию
                    product.categoryName = key;
                  }
                  
                  // Создаем slug из названия
                  if (product.name) {
                    const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
                    product.slug = product.name
                      .toLowerCase()
                      .replace(cyrillicPattern, '')
                      .replace(/\s+/g, '-')
                      .substring(0, 50); // Ограничиваем длину slug
                      
                    // Добавляем уникальный идентификатор к slug
                    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    product.slug = `${product.slug}-${randomPart}`;
                  }
                  
                  products.push(product);
                } catch (err) {
                  console.error(`Ошибка при обработке товара в ${path}/${key}[${index}]:`, err);
                }
              });
            }
          }
          // Рекурсивно обрабатываем вложенные объекты
          else if (typeof value === 'object' && value !== null) {
            findProducts(value, `${path}/${key}`);
          }
        }
      };
      
      // Начинаем поиск товаров с корневого элемента
      findProducts(result, "");
      
      if (products.length === 0) {
        throw new Error('Не удалось найти товары в XML файле');
      }
      
      console.log(`Найдено ${products.length} товаров в неизвестном формате XML`);
      return products;
    }
    
    // Если не удалось обработать ни один формат, возвращаем ошибку
    throw new Error('Не удалось определить формат XML или найти товары');
    
  } catch (error: any) {
    console.error("Ошибка парсинга XML:", error);
    throw new Error(`Ошибка формата XML: ${error.message}`);
  }
}