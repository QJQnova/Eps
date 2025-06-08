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
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    if (fileExtension === '.json') {
      return parseJsonFile(fileContent);
    } else if (fileExtension === '.csv') {
      return parseCsvFile(fileContent);
    } else if (fileExtension === '.xml') {
      try {
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
    // Преобразуем функцию parseString в Promise
    // Создаем типизированную промисифицированную функцию
    const parseXmlAsync = promisify<string, object>(parseString);
    
    // Парсим XML
    const result = await parseXmlAsync(content);
    
    console.log("Результат парсинга XML:", JSON.stringify(result, null, 2).substring(0, 500) + "...");
    
    if (!result) {
      throw new Error('XML файл не может быть прочитан');
    }
    
    // Обработка YML-формата (Яндекс.Маркет)
    if (result.yml_catalog) {
      console.log("Обнаружен формат YML-каталога");
      return parseYmlFormat(result);
    }
    
    // Обработка формата СТАНИКС (прямые offer элементы в корне)
    if (result.offer || (result.name && result.categories)) {
      console.log("Обнаружен формат каталога СТАНИКС");
      return parseStanixFormat(result);
    }
    
    throw new Error('XML не содержит необходимой структуры данных для товаров');
  } catch (error: any) {
    console.error("XML parsing error:", error);
    throw new Error(`Ошибка при разборе XML: ${error.message}`);
  }
}

/**
 * Парсит YML-формат (Яндекс.Маркет)
 */
function parseYmlFormat(result: any): ImportProduct[] {
  // Извлекаем shop - может быть массивом или объектом
  const shop = Array.isArray(result.yml_catalog.shop) 
    ? result.yml_catalog.shop[0] 
    : result.yml_catalog.shop;
  
  if (!shop || !shop.offers || !shop.offers[0] || !shop.offers[0].offer) {
    console.log("Структура shop:", JSON.stringify(shop, null, 2));
    throw new Error('XML файл не содержит необходимых данных о товарах (формат YML)');
  }
  
  // Обрабатываем категории, если они есть
  const categoriesMap: Record<string, {id: number, name: string}> = {};
  
  if (shop.categories && shop.categories[0] && shop.categories[0].category) {
    // Если есть только одна категория, преобразуем в массив
    const categories = Array.isArray(shop.categories[0].category)
      ? shop.categories[0].category
      : [shop.categories[0].category];
    
    categories.forEach((cat: any) => {
      if (cat.$ && cat.$.id && cat._) {
        categoriesMap[cat.$.id] = {
          id: Number(cat.$.id),
          name: cat._
        };
      }
    });
  }
  
  // Получаем список товаров
  const offers = Array.isArray(shop.offers[0].offer)
    ? shop.offers[0].offer
    : [shop.offers[0].offer];
  
  // Преобразуем каждый товар
  return offers.map((offer: any, index: number) => {
        const product: ImportProduct = {};
        
        // Получаем название товара из разных возможных полей
        if (offer.name && offer.name[0]) product.name = offer.name[0];
        else if (offer.model && offer.model[0]) product.name = offer.model[0];
        else if (offer.typePrefix && offer.typePrefix[0] && offer.vendor && offer.vendor[0] && offer.model && offer.model[0]) {
          product.name = `${offer.typePrefix[0]} ${offer.vendor[0]} ${offer.model[0]}`;
        }
        
        // Если нет имени, пропускаем этот товар
        if (!product.name) {
          console.warn(`Товар #${index} пропущен - отсутствует название`);
          return null;
        }
        
        // SKU/Артикул
        if (offer.$ && offer.$.id) product.sku = offer.$.id;
        else if (offer.vendorCode && offer.vendorCode[0]) product.sku = offer.vendorCode[0];
        else if (offer.article && offer.article[0]) product.sku = offer.article[0];
        else {
          // Генерация SKU из ID или уникального значения
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          product.sku = `YML-${randomPart}`;
        }
        
        // Цена
        if (offer.price && offer.price[0]) product.price = parseFloat(offer.price[0]);
        else if (offer.oldprice && offer.oldprice[0]) product.price = parseFloat(offer.oldprice[0]);
        
        // Описание
        if (offer.description && offer.description[0]) product.description = offer.description[0];
        
        // URL изображения
        if (offer.picture) {
          if (Array.isArray(offer.picture) && offer.picture.length > 0) {
            product.imageUrl = offer.picture[0];
          }
        }
        
        // Категория
        if (offer.categoryId && offer.categoryId[0] && categoriesMap[offer.categoryId[0]]) {
          product.categoryName = categoriesMap[offer.categoryId[0]].name;
        }
        
        // Статус активности (по умолчанию активный)
        product.isActive = offer.$ ? offer.$.available !== 'false' : true;
        product.isFeatured = false;
        
        // Генерируем slug из названия
        product.slug = product.name
          .toLowerCase()
          .replace(/[^a-zа-я0-9\s]/gi, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);
        
        return product;
      }).filter(Boolean) as ImportProduct[];
}

/**
 * Парсит формат СТАНИКС (прямые offer элементы в корне)
 */
function parseStanixFormat(result: any): ImportProduct[] {
  // Обрабатываем категории
  const categoriesMap: Record<string, string> = {};
  
  if (result.categories && result.categories[0] && result.categories[0].category) {
    const categories = Array.isArray(result.categories[0].category)
      ? result.categories[0].category
      : [result.categories[0].category];
    
    categories.forEach((cat: any) => {
      if (cat.$ && cat.$.id && cat._) {
        categoriesMap[cat.$.id] = cat._;
      }
    });
  }
  
  // Получаем список товаров - offer может быть массивом или одним элементом
  let offers = [];
  if (result.offer) {
    offers = Array.isArray(result.offer) ? result.offer : [result.offer];
  }
  
  // Преобразуем каждый товар
  return offers.map((offer: any, index: number) => {
    const product: ImportProduct = {};
    
    // Название товара
    if (offer.name && offer.name[0]) {
      product.name = offer.name[0];
    }
    
    // Если нет имени, пропускаем этот товар
    if (!product.name) {
      console.warn(`Товар #${index} пропущен - отсутствует название`);
      return null;
    }
    
    // SKU/Артикул из атрибута id
    if (offer.$ && offer.$.id) {
      product.sku = `STANIX-${offer.$.id}`;
    }
    
    // Цена
    if (offer.price && offer.price[0]) {
      const priceValue = parseFloat(offer.price[0]);
      if (!isNaN(priceValue)) {
        product.price = priceValue.toString();
      }
    }
    
    // Описание
    if (offer.description && offer.description[0]) {
      product.description = offer.description[0];
    }
    
    // Изображение
    if (offer.picture && offer.picture[0]) {
      product.imageUrl = offer.picture[0];
    }
    
    // Категория
    if (offer.categoryId && offer.categoryId[0] && categoriesMap[offer.categoryId[0]]) {
      product.categoryName = categoriesMap[offer.categoryId[0]];
    }
    
    // Доступность товара
    if (offer.$ && offer.$.available) {
      product.isActive = offer.$.available === 'true';
    } else {
      product.isActive = true; // По умолчанию активен
    }
    
    // Генерация slug из названия
    if (product.name) {
      product.slug = product.name
        .toLowerCase()
        .replace(/[^a-zа-я0-9\s]/gi, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
    }
    
    return product;
  }).filter(Boolean) as ImportProduct[];
}