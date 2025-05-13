import fs from "fs/promises";
import { parse as csvParse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";
import { parseString } from "xml2js";
import { promisify } from "util";

/**
 * Parses a CSV, JSON or XML file and returns an array of product data
 */
export async function parseImportFile(filePath: string, fileExtension: string): Promise<Partial<InsertProduct>[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    if (fileExtension === '.json') {
      return parseJsonFile(fileContent);
    } else if (fileExtension === '.csv') {
      return parseCsvFile(fileContent);
    } else if (fileExtension === '.xml') {
      return await parseXmlFile(fileContent);
    } else {
      throw new Error('Unsupported file format. Please use CSV, JSON or XML.');
    }
  } catch (error: any) {
    throw new Error(`Error parsing file: ${error.message}`);
  }
}

/**
 * Parse JSON file content into product data
 */
function parseJsonFile(content: string): Partial<InsertProduct>[] {
  try {
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of products');
    }
    
    return data;
  } catch (error: any) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

/**
 * Parse CSV file content into product data
 */
function parseCsvFile(content: string): Partial<InsertProduct>[] {
  try {
    // Parse CSV with headers
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('CSV file contains no valid data');
    }
    
    // Convert string values to appropriate types
    return records.map(record => {
      const product: Partial<InsertProduct> = {};
      
      // Map CSV columns to product properties
      Object.keys(record).forEach(key => {
        const value = record[key];
        
        // Skip empty values
        if (value === "" || value === undefined) return;
        
        // Convert numeric fields
        if (key === 'price' || key === 'originalPrice') {
          product[key as keyof InsertProduct] = parseFloat(value);
        } 
        // Convert boolean fields
        else if (key === 'isActive' || key === 'isFeatured') {
          product[key as keyof InsertProduct] = value.toLowerCase() === 'true';
        }
        // Convert integer fields
        else if (key === 'stock' || key === 'categoryId') {
          product[key as keyof InsertProduct] = parseInt(value, 10);
        }
        // Keep string fields as is
        else {
          product[key as keyof InsertProduct] = value;
        }
      });
      
      return product;
    });
  } catch (error: any) {
    throw new Error(`Invalid CSV format: ${error.message}`);
  }
}

/**
 * Parse XML file content into product data
 */
async function parseXmlFile(content: string): Promise<Partial<InsertProduct>[]> {
  try {
    const parseXmlPromise = promisify(parseString);
    const result: any = await parseXmlPromise(content, { 
      explicitArray: false,
      normalizeTags: true,
      mergeAttrs: true
    });
    
    if (!result || !result.yml_catalog || !result.yml_catalog.shop || !result.yml_catalog.shop.offers || !result.yml_catalog.shop.offers.offer) {
      throw new Error('XML file does not contain valid product data structure');
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
    
    return offers.map((offer: any) => {
      const product: Partial<InsertProduct> = {};
      
      // Маппинг полей YML на поля нашей модели продукта
      if (offer.id) product.sku = offer.id.toString();
      if (offer.name || offer._) product.name = offer.name || offer._;
      if (offer.model) product.name = offer.model; // Приоритет model над name
      if (offer.description) product.description = offer.description;
      if (offer.price) product.price = parseFloat(offer.price);
      if (offer.oldprice) product.originalPrice = parseFloat(offer.oldprice);
      if (offer.currencyid && offer.currencyid === 'RUR') product.currency = '₽';
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
      if (offer.param && Array.isArray(offer.param)) {
        const specs: Record<string, string> = {};
        offer.param.forEach((param: any) => {
          if (param.name && param._) {
            specs[param.name] = param._;
          }
        });
        if (Object.keys(specs).length > 0) {
          product.specs = JSON.stringify(specs);
        }
      }
      
      // Создаем slug из названия
      if (product.name) {
        product.slug = product.name
          .toLowerCase()
          .replace(/[^\wа-яё ]/gui, '')
          .replace(/\s+/g, '-');
      }
      
      return product;
    });
  } catch (error: any) {
    throw new Error(`Invalid XML format: ${error.message}`);
  }
}
