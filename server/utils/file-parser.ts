import * as fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";
import { parseString } from "xml2js";
import { promisify } from "util";

/**
 * Парсит файл CSV, JSON или XML и возвращает массив данных товаров
 */
export async function parseImportFile(filePath: string, fileExtension: string): Promise<Partial<InsertProduct>[]> {
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
function parseJsonFile(content: string): Partial<InsertProduct>[] {
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
function parseCsvFile(content: string): Partial<InsertProduct>[] {
  try {
    // Парсим CSV-файл с заголовками
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return records.map((record: any) => {
      // Конвертируем строковые значения в соответствующие типы
      const product: Partial<InsertProduct> = {};
      
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
async function parseXmlFile(content: string): Promise<Partial<InsertProduct>[]> {
  try {
    // Преобразуем функцию parseString в Promise
    const parseXmlAsync = promisify<string, any>(parseString);
    
    // Парсим XML с опциями
    const result = await parseXmlAsync(content, {
      explicitArray: false,
      normalizeTags: true,
      mergeAttrs: true
    });
    
    console.log("Результат парсинга XML:", JSON.stringify(result, null, 2).substring(0, 500) + "...");
    
    if (!result) {
      throw new Error('XML файл не может быть прочитан');
    }
    
    // Обработка YML-формата (Яндекс.Маркет)
    if (result.yml_catalog) {
      console.log("Обнаружен формат YML-каталога");
      
      if (!result.yml_catalog.shop || !result.yml_catalog.shop.offers || !result.yml_catalog.shop.offers.offer) {
        throw new Error('XML файл не содержит необходимых данных о товарах (формат YML)');
      }
      
      // Обрабатываем категории, если они есть
      const categoriesMap: Record<string, number> = {};
      
      if (result.yml_catalog.shop.categories && result.yml_catalog.shop.categories.category) {
        // Если есть только одна категория, преобразуем в массив
        const categories = Array.isArray(result.yml_catalog.shop.categories.category)
          ? result.yml_catalog.shop.categories.category
          : [result.yml_catalog.shop.categories.category];
        
        categories.forEach((cat: any) => {
          if (cat.id && cat._) {
            categoriesMap[cat.id] = Number(cat.id);
          }
        });
      }
      
      // Получаем список товаров
      const offers = Array.isArray(result.yml_catalog.shop.offers.offer)
        ? result.yml_catalog.shop.offers.offer
        : [result.yml_catalog.shop.offers.offer];
      
      // Преобразуем каждый товар
      return offers.map((offer: any) => {
        const product: Partial<InsertProduct> = {};
        
        // Маппинг полей YML на поля нашей модели продукта
        if (offer.id) product.sku = offer.id.toString();
        if (offer.name || offer._) product.name = offer.name || offer._;
        if (offer.model) product.name = offer.model; // Приоритет model над name
        if (offer.description) product.description = offer.description;
        if (offer.price) product.price = parseFloat(offer.price).toString();
        if (offer.oldprice) product.originalPrice = parseFloat(offer.oldprice).toString();
        if (offer.picture) product.imageUrl = offer.picture;
        if (offer.categoryid && categoriesMap[offer.categoryid]) {
          product.categoryId = categoriesMap[offer.categoryid];
        }
        
        // Статус доступности
        if (offer.available) {
          product.isActive = offer.available.toLowerCase() === 'true';
          product.stock = product.isActive ? 100 : 0; // Примерное значение для наличия
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
            .replace(/\s+/g, '-');
        }
        
        return product;
      });
    } else {
      // Обработка других форматов XML
      console.log("XML не соответствует формату YML, пробуем другие форматы");
      throw new Error('Формат XML не распознан. Поддерживается только формат YML.');
    }
  } catch (error: any) {
    console.error("Ошибка парсинга XML:", error);
    throw new Error(`Ошибка формата XML: ${error.message}`);
  }
}