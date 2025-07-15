
import fs from 'fs/promises';
import path from 'path';
import XLSX from 'xlsx';
import { parse } from 'csv-parse';

export interface ParsedProduct {
  name: string;
  sku: string;
  slug: string;
  price: string;
  originalPrice?: string;
  categoryName?: string;
  categoryId?: number;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  tag?: string;
}

export async function parseImportFile(filePath: string, fileExtension: string): Promise<ParsedProduct[]> {
  try {
    console.log(`Парсинг файла: ${filePath} с расширением: ${fileExtension}`);

    switch (fileExtension.toLowerCase()) {
      case '.csv':
        return await parseCSVFile(filePath);
      case '.xlsx':
      case '.xls':
        return await parseExcelFile(filePath);
      case '.json':
        return await parseJSONFile(filePath);
      case '.xml':
        return await parseXMLFile(filePath);
      default:
        throw new Error(`Неподдерживаемый формат файла: ${fileExtension}`);
    }
  } catch (error: any) {
    console.error('Ошибка парсинга файла:', error);
    throw new Error(`Ошибка парсинга файла: ${error.message}`);
  }
}

async function parseCSVFile(filePath: string): Promise<ParsedProduct[]> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  
  return new Promise((resolve, reject) => {
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      quote: '"',
      escape: '"'
    }, (err, records) => {
      if (err) {
        reject(err);
        return;
      }

      const products: ParsedProduct[] = records.map((record: any, index: number) => {
        const name = String(record.название || record.name || record.Название || record.Name || '').trim();
        const sku = String(record.артикул || record.sku || record.Артикул || record.SKU || record.код || record.Код || `AUTO-${Date.now()}-${index}`).trim();
        const price = String(record.цена || record.price || record.Цена || record.Price || '0').replace(/[^\d.,]/g, '') || '0';
        const categoryName = String(record.категория || record.category || record.Категория || record.Category || 'Общие товары').trim();
        const description = String(record.описание || record.description || record.Описание || record.Description || '').trim();

        return {
          name,
          sku,
          slug: generateSlug(name),
          price,
          categoryName,
          description: description || `${name} - профессиональный инструмент`,
          shortDescription: description ? description.substring(0, 200) : name,
          isActive: true,
          isFeatured: false
        };
      }).filter(product => product.name && product.name.length > 2);

      resolve(products);
    });
  });
}

async function parseExcelFile(filePath: string): Promise<ParsedProduct[]> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return jsonData.map((record: any, index: number) => {
    const name = String(record.название || record.name || record.Название || record.Name || '').trim();
    const sku = String(record.артикул || record.sku || record.Артикул || record.SKU || record.код || record.Код || `AUTO-${Date.now()}-${index}`).trim();
    const price = String(record.цена || record.price || record.Цена || record.Price || '0').replace(/[^\d.,]/g, '') || '0';
    const categoryName = String(record.категория || record.category || record.Категория || record.Category || 'Общие товары').trim();
    const description = String(record.описание || record.description || record.Описание || record.Description || '').trim();

    return {
      name,
      sku,
      slug: generateSlug(name),
      price,
      categoryName,
      description: description || `${name} - профессиональный инструмент`,
      shortDescription: description ? description.substring(0, 200) : name,
      isActive: true,
      isFeatured: false
    };
  }).filter(product => product.name && product.name.length > 2);
}

async function parseJSONFile(filePath: string): Promise<ParsedProduct[]> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  if (!Array.isArray(data)) {
    throw new Error('JSON файл должен содержать массив товаров');
  }

  return data.map((record: any, index: number) => {
    const name = String(record.название || record.name || record.Название || record.Name || '').trim();
    const sku = String(record.артикул || record.sku || record.Артикул || record.SKU || record.код || record.Код || `AUTO-${Date.now()}-${index}`).trim();
    const price = String(record.цена || record.price || record.Цена || record.Price || '0').replace(/[^\d.,]/g, '') || '0';
    const categoryName = String(record.категория || record.category || record.Категория || record.Category || 'Общие товары').trim();
    const description = String(record.описание || record.description || record.Описание || record.Description || '').trim();

    return {
      name,
      sku,
      slug: generateSlug(name),
      price,
      categoryName,
      description: description || `${name} - профессиональный инструмент`,
      shortDescription: description ? description.substring(0, 200) : name,
      isActive: true,
      isFeatured: false
    };
  }).filter(product => product.name && product.name.length > 2);
}

async function parseXMLFile(filePath: string): Promise<ParsedProduct[]> {
  // Простая реализация XML парсинга для базовых случаев
  const fileContent = await fs.readFile(filePath, 'utf-8');
  
  // Базовый парсинг XML для товаров
  const products: ParsedProduct[] = [];
  const productMatches = fileContent.match(/<product[^>]*>[\s\S]*?<\/product>/gi);
  
  if (productMatches) {
    productMatches.forEach((productXml, index) => {
      const nameMatch = productXml.match(/<name[^>]*>(.*?)<\/name>/i);
      const skuMatch = productXml.match(/<sku[^>]*>(.*?)<\/sku>/i) || productXml.match(/<id[^>]*>(.*?)<\/id>/i);
      const priceMatch = productXml.match(/<price[^>]*>(.*?)<\/price>/i);
      const categoryMatch = productXml.match(/<category[^>]*>(.*?)<\/category>/i);
      const descriptionMatch = productXml.match(/<description[^>]*>(.*?)<\/description>/i);

      const name = nameMatch ? nameMatch[1].trim() : '';
      const sku = skuMatch ? skuMatch[1].trim() : `AUTO-${Date.now()}-${index}`;
      const price = priceMatch ? priceMatch[1].replace(/[^\d.,]/g, '') || '0' : '0';
      const categoryName = categoryMatch ? categoryMatch[1].trim() : 'Общие товары';
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';

      if (name && name.length > 2) {
        products.push({
          name,
          sku,
          slug: generateSlug(name),
          price,
          categoryName,
          description: description || `${name} - профессиональный инструмент`,
          shortDescription: description ? description.substring(0, 200) : name,
          isActive: true,
          isFeatured: false
        });
      }
    });
  }

  return products;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || `product-${Date.now()}`;
}
