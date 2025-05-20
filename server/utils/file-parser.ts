import * as fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";
import { parseString } from "xml2js";
import { promisify } from "util";

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
    // Проверяем, не содержит ли файл DOCTYPE или другие декларации, которые могут вызвать проблемы
    // Удаляем XML-декларацию и DOCTYPE, если они есть
    let cleanContent = content;
    if (content.startsWith('<?xml')) {
      cleanContent = content.substring(content.indexOf('?>') + 2).trim();
    }
    
    // Преобразуем функцию parseString в Promise
    // Создаем типизированную промисифицированную функцию
    // Мы будем использовать непосредственно саму функцию parseString с колбеком вместо промисификации
    // с неправильными параметрами
    
    // Выводим начало XML для диагностики
    console.log("Начало XML файла:", cleanContent.substring(0, 500));
    
    // Создаем промис вручную для парсинга XML
    const result = await new Promise<any>((resolve, reject) => {
      parseString(content, {
        explicitArray: false, // Не преобразовывать одиночные элементы в массивы
        normalizeTags: false, // Сохранять оригинальный регистр тегов
        trim: true, // Удалять лишние пробелы
        strict: false, // Отключаем строгую проверку XML
        mergeAttrs: true // Объединяем атрибуты и элементы для упрощения доступа
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
      }).filter(Boolean) as Partial<InsertProduct>[];
    } else {
      // Файл может быть в другом формате (не в стандартном YML)
      console.log("Файл ПРОСВАР.xml в нестандартном формате. Применяю специальную обработку...");
      
      try {
        // Проверяем, есть ли в корне документа элемент shop
        if (result && result.shop) {
          console.log("Найден элемент shop в корне документа");
          const shop = result.shop;
          
          // Проверяем наличие товаров в структуре shop
          if (shop.offers && shop.offers.offer) {
            const offers = Array.isArray(shop.offers.offer) ? shop.offers.offer : [shop.offers.offer];
            console.log(`Найдено ${offers.length} товаров в shop.offers.offer`);
            
            // Создаем список категорий если они есть
            const categoriesMap: Record<string, {id: number, name: string}> = {};
            if (shop.categories && shop.categories.category) {
              const categories = Array.isArray(shop.categories.category) ? 
                shop.categories.category : [shop.categories.category];
              
              categories.forEach((cat: any, index: number) => {
                const catId = cat.id || cat.$ && cat.$.id || (index + 1).toString();
                const catName = cat._ || cat._value || cat.name || `Категория ${catId}`;
                categoriesMap[catId.toString()] = {
                  id: Number(catId),
                  name: catName.toString()
                };
              });
              
              console.log(`Обработано ${Object.keys(categoriesMap).length} категорий`);
            }
            
            // Обрабатываем товары
            return offers.map((offer: any, index: number) => {
              const product: ImportProduct = {};
              
              // Название товара
              product.name = offer.name || offer.model || offer.title || offer._ || `Товар ${index + 1}`;
              
              // Генерируем SKU из ID или названия
              product.sku = offer.id || offer.sku || offer.vendorCode || 
                `SKU-${product.name ? product.name.substring(0, 10) : 'unknown'}-${index + 1}`;
              
              // Цена
              product.price = offer.price ? offer.price.toString() : "0";
              
              // Описание
              product.description = offer.description || null;
              
              // Изображение
              product.imageUrl = offer.picture || offer.image || null;
              
              // Обработка категории
              if (offer.categoryId && categoriesMap[offer.categoryId]) {
                product.categoryId = categoriesMap[offer.categoryId].id;
                product.categoryName = categoriesMap[offer.categoryId].name;
              } else if (offer.categoryId) {
                product.categoryId = parseInt(offer.categoryId, 10);
                product.categoryName = `Категория ${offer.categoryId}`;
              } else {
                product.categoryId = 1;
              }
              
              // Slug - генерируем из названия или используем дефолтное значение
              product.slug = (product.name ? 
                product.name
                  .toLowerCase()
                  .replace(/[^a-zA-Zа-яА-ЯёЁ0-9 ]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 40) 
                : `product-${index}`) + `-${index + 1}`;
              
              // Статус
              product.isActive = true;
              product.stock = 100;
              
              return product;
            });
          }
        }
        
        // Если предыдущие проверки не сработали, используем более универсальный подход
        console.log("Применяю глубокий поиск товаров в XML структуре...");
        
        // Функция для рекурсивного поиска товаров в любой структуре XML
        const findProducts = (obj: any, prefix: string = ""): ImportProduct[] => {
          const products: ImportProduct[] = [];
          
          if (!obj) return products;
          
          // Если это массив, обрабатываем каждый элемент
          if (Array.isArray(obj)) {
            let index = 0;
            for (const item of obj) {
              products.push(...findProducts(item, `${prefix}[${index}]`));
              index++;
            }
            return products;
          }
          
          // Если это объект, проверяем его свойства
          if (typeof obj === 'object') {
            // Проверяем, похож ли этот объект на товар
            if ((obj.price || obj.cost) && (obj.name || obj.title || obj.model)) {
              // Этот объект похож на товар, преобразуем его
              const product: ImportProduct = {};
              
              // Получаем название
              product.name = obj.name || obj.title || obj.model || obj.article || `Товар из ${prefix}`;
              
              // Генерируем SKU
              product.sku = obj.id || obj.sku || obj.code || obj.articul || obj.article || 
                `SKU-${Math.floor(Math.random() * 10000)}`;
              
              // Цена
              product.price = (obj.price || obj.cost || "0").toString();
              
              // Описание
              product.description = obj.description || obj.desc || null;
              
              // Изображение
              product.imageUrl = obj.picture || obj.image || obj.photo || obj.img || null;
              
              // Категория (используем категорию по умолчанию)
              product.categoryId = 1;
              if (obj.category) {
                product.categoryName = typeof obj.category === 'string' ? 
                  obj.category : 
                  (obj.category.name || obj.category._ || "Импортированная категория");
              }
              
              // Slug с проверкой на undefined
              product.slug = (product.name ? 
                product.name
                  .toLowerCase()
                  .replace(/[^a-zA-Zа-яА-ЯёЁ0-9 ]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 40) 
                : `product-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`) + 
                `-${Math.floor(Math.random() * 10000)}`;
              
              // Товар активен по умолчанию
              product.isActive = true;
              product.stock = 100;
              
              products.push(product);
            }
            
            // Рекурсивно ищем в каждом свойстве
            for (const key in obj) {
              if (typeof obj[key] === 'object') {
                products.push(...findProducts(obj[key], `${prefix}.${key}`));
              }
            }
          }
          
          return products;
        };
        
        // Применяем универсальный поиск
        const foundProducts = findProducts(result);
        
        if (foundProducts.length > 0) {
          console.log(`Найдено ${foundProducts.length} товаров в структуре XML с помощью универсального поиска`);
          return foundProducts;
        }
        
        // Если ничего не найдено, выбрасываем ошибку
        throw new Error('Не удалось найти товары в структуре XML');
      } catch (err: any) {
        console.error("Ошибка при обработке альтернативного формата XML:", err);
        throw new Error(`Не удалось обработать XML-файл: ${err.message}`);
      }
    }
  } catch (error: any) {
    console.error("Ошибка парсинга XML:", error);
    throw new Error(`Ошибка формата XML: ${error.message}`);
  }
}