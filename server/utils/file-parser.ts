import * as fs from "fs/promises";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";
import { parseString } from "xml2js";
import { promisify } from "util";
import XLSX from "xlsx";
import * as iconv from "iconv-lite";

// Расширенный тип для работы с импортом
interface ImportProduct {
  name?: string;
  sku?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  price?: string;
  originalPrice?: string;
  imageUrl?: string | null;
  stock?: number;
  categoryId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  tag?: string | null;
  categoryName?: string;
}

/**
 * Парсит файл CSV, JSON или XML и возвращает массив данных товаров
 */
export async function parseImportFile(filePath: string, fileExtension: string): Promise<ImportProduct[]> {
  try {
    // For XLSX/XLS files, we don't read as UTF-8 text
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      return parseXlsxFile(filePath);
    }

    // For text-based files, try UTF-8 first, then Windows-1251
    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf8');
      // Check if content looks like Windows-1251 by detecting specific bytes
      if (fileContent.includes('�') || fileContent.includes('\ufffd')) {
        throw new Error('UTF-8 decoding failed, trying Windows-1251');
      }
    } catch (utfError) {
      // Try Windows-1251 encoding
      console.log('UTF-8 failed, trying Windows-1251 encoding...');
      const buffer = await fs.readFile(filePath);
      try {
        fileContent = iconv.decode(buffer, 'win1251');
        console.log(`File decoded from Windows-1251, content length: ${fileContent.length}`);
      } catch (iconvError) {
        // Fallback to UTF-8 with error replacement
        fileContent = await fs.readFile(filePath, 'utf8');
      }
    }

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
      throw new Error('Неподдерживаемый формат файла. Пожалуйста, используйте CSV, JSON, XML или XLSX.');
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
    // Специальная обработка для файлов pittools.ru
    if (content.includes('pittools.ru') || content.includes('Изображения;Название;Артикул')) {
      return parsePittoolsCsv(content);
    }

    // Стандартная обработка CSV с упрощенным парсингом
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV файл пустой или содержит только заголовки');
    }

    const headers = lines[0].split(';').map(h => h.trim());
    const products: ImportProduct[] = [];

    for (let i = 1; i < lines.length && products.length < 100; i++) {
      const fields = lines[i].split(';');
      if (fields.length >= 3) {
        const name = fields[1]?.trim();
        const sku = fields[2]?.trim();
        const price = fields[3]?.trim();

        if (name && sku && price) {
          const cleanPrice = price.replace(/[^\d.,]/g, '').replace(',', '.');
          const priceNum = parseFloat(cleanPrice);

          if (!isNaN(priceNum) && priceNum > 0) {
            products.push({
              name: name,
              sku: sku,
              slug: generateProductSlug(name + '-' + sku),
              price: priceNum.toString(),
              categoryName: fields[6]?.trim() || 'Общая категория',
              isActive: true
            });
          }
        }
      }
    }

    if (products.length === 0) {
      throw new Error('Не найдено валидных товаров в CSV файле');
    }

    return products;
  } catch (error: any) {
    throw new Error(`Ошибка парсинга CSV: ${error.message}`);
  }
}

/**
 * Специальный парсер для CSV файлов pittools.ru
 */
function parsePittoolsCsv(content: string): ImportProduct[] {
  const lines = content.split('\n');
  const products: ImportProduct[] = [];
  
  if (lines.length < 2) {
    throw new Error('CSV файл пустой или содержит только заголовки');
  }

  // Извлекаем заголовки
  const headers = lines[0].split(';').map(h => h.trim());
  console.log(`Найдено заголовков: ${headers.length}`);
  console.log('Заголовки:', headers.slice(0, 10));

  let validProductsCount = 0;
  let currentRecord = '';
  let insideQuotes = false;
  let fieldCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Подсчитываем количество кавычек для определения многострочных записей
    const quoteCount = (line.match(/"/g) || []).length;
    
    if (!insideQuotes) {
      // Начинаем новую запись
      currentRecord = line;
      fieldCount = (line.match(/;/g) || []).length + 1;
      
      // Проверяем, начинается ли многострочная запись
      if (quoteCount % 2 === 1) {
        insideQuotes = true;
        continue;
      }
    } else {
      // Продолжаем многострочную запись
      currentRecord += ' ' + line;
      fieldCount += (line.match(/;/g) || []).length;
      
      // Проверяем, заканчивается ли многострочная запись
      if (quoteCount % 2 === 1) {
        insideQuotes = false;
      } else {
        continue;
      }
    }

    // Обрабатываем завершенную запись
    if (!insideQuotes && currentRecord.trim()) {
      const fields = currentRecord.split(';');
      
      // Пропускаем записи с недостаточным количеством полей
      if (fields.length < 7) {
        continue;
      }

      const imageUrl = fields[0]?.trim().replace(/^"|"$/g, '') || '';
      const name = fields[1]?.trim().replace(/^"|"$/g, '') || '';
      const sku = fields[2]?.trim().replace(/^"|"$/g, '') || '';
      const priceStr = fields[3]?.trim().replace(/^"|"$/g, '') || '';
      const currency = fields[4]?.trim().replace(/^"|"$/g, '') || '';
      const availability = fields[5]?.trim().replace(/^"|"$/g, '') || '';
      const categoryName = fields[6]?.trim().replace(/^"|"$/g, '') || '';
      const subcategoryName = fields[7]?.trim().replace(/^"|"$/g, '') || '';
      const section = fields[8]?.trim().replace(/^"|"$/g, '') || '';
      const url = fields[9]?.trim().replace(/^"|"$/g, '') || '';
      const description = fields[10]?.trim().replace(/^"|"$/g, '') || '';

      // Валидация обязательных полей
      if (!name || !sku || !categoryName || name.length < 3) {
        continue;
      }

      // Парсинг цены
      const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
      const price = parseFloat(cleanPrice);
      
      if (isNaN(price) || price <= 0) {
        continue;
      }

      const product: ImportProduct = {
        name: name,
        sku: sku,
        slug: generateProductSlug(name + '-' + sku),
        price: price.toString(),
        categoryName: categoryName,
        description: cleanHtmlDescription(description),
        shortDescription: subcategoryName || section || null,
        imageUrl: imageUrl || null,
        isActive: availability === 'Да' || availability === 'В наличии',
        tag: section || null
      };

      products.push(product);
      validProductsCount++;

      if (validProductsCount % 100 === 0) {
        console.log(`Обработано товаров: ${validProductsCount}`);
      }

      // Ограничиваем количество для тестирования
      if (validProductsCount >= 1000) {
        console.log('Достигнут лимит 1000 товаров для тестирования');
        break;
      }
    }
  }

  console.log(`Успешно обработано товаров: ${validProductsCount}`);
  
  if (validProductsCount === 0) {
    throw new Error('Не найдено валидных товаров в CSV файле');
  }

  return products;
}

/**
 * Генерирует slug для товара
 */
function generateProductSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Очищает HTML описание товара
 */
function cleanHtmlDescription(description: string): string {
  if (!description) return '';
  
  return description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n**')
    .replace(/<\/h[1-6]>/gi, '**\n\n')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 2000);
}

/**
 * Стандартный парсер CSV
 */
function parseStandardCsv(content: string): ImportProduct[] {
  // Предобработка контента для исправления проблемных кавычек
  let cleanedContent = content
    // Удаляем BOM если есть
    .replace(/^\uFEFF/, '')
    // Заменяем нестандартные кавычки на стандартные
    .replace(/[""'']/g, '"')
    // Исправляем одиночные кавычки в середине строк
    .replace(/([^,\r\n])"([^,\r\n])/g, '$1""$2')
    // Удаляем лишние пробелы вокруг кавычек
    .replace(/\s*"\s*/g, '"')
    // Исправляем кавычки в конце полей
    .replace(/"(\s*[,\r\n])/g, '"$1')
    // Удаляем множественные пустые строки в конце
    .replace(/(\r?\n\s*){10,}$/, '\n');

  // Проверяем, что файл не пустой после очистки
  if (!cleanedContent.trim()) {
    throw new Error('Файл пуст после предобработки');
  }

  console.log(`CSV файл: ${cleanedContent.split('\n').length} строк, ${cleanedContent.length} символов`);

  // Парсим CSV-файл с заголовками и более мягкой обработкой кавычек
  const records = parse(cleanedContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    quote: '"',
    escape: '"',
    relax_quotes: true,
    relax_column_count: true,
    skip_records_with_error: true,
    max_record_size: 1000000
  });

  let validProducts = 0;
  let consecutiveEmpty = 0;
  const maxConsecutiveEmpty = 50; // Останавливаем после 50 пустых строк подряд

  const products = records.map((record: any, index: number) => {
      // Конвертируем строковые значения в соответствующие типы
      const product: ImportProduct = {};

      // Проверяем, что запись не пустая - более строгая проверка
      const recordValues = Object.values(record);
      const hasAnyData = recordValues.some(value => 
        value && 
        String(value).trim() !== '' && 
        String(value).trim() !== '0' &&
        !String(value).trim().match(/^[\s\n\r]*$/)
      );

      if (!hasAnyData) {
        consecutiveEmpty++;
        if (consecutiveEmpty > maxConsecutiveEmpty) {
          console.log(`Прекращаем обработку после ${maxConsecutiveEmpty} пустых строк подряд`);
          return null;
        }
        return null;
      }

      consecutiveEmpty = 0; // Сбрасываем счетчик пустых строк

      // Обязательные поля с поддержкой новой структуры CSV
      const name = record['Название'] || record.name || record['название'] || record.Name || record['Наименование'] || record['наименование'];
      const price = record['Цена'] || record.price || record['цена'] || record.Price || '0';

      // Более строгая проверка названия
      if (!name || String(name).trim() === '' || String(name).trim().length < 2) {
        return null;
      }

      validProducts++;

      // Маппинг полей с преобразованием типов
      product.name = name;
      
      // Обработка цены - убираем валютные символы и лишние символы
      let cleanPrice = price.toString().replace(/[^\d.,]/g, '').replace(',', '.');
      product.price = (parseFloat(cleanPrice) || 0).toString();

      // Опциональные поля с поддержкой новой структуры CSV
      const sku = record['Артикул'] || record.sku || record['артикул'] || record.SKU;
      const description = record['Описание'] || record.description || record['описание'] || record.Description;
      const shortDescription = record.shortDescription || record['короткое описание'] || record['краткое описание'];
      const imageUrl = record['Изображения'] || record.imageUrl || record['изображение'] || record['картинка'] || record['Изображение'];
      const categoryName = record['Категория'] || record.categoryName || record['категория'] || record.category;
      const subCategoryName = record['Подкатегория'] || record['подкатегория'];
      const sectionName = record['Раздел'] || record['раздел'];
      const currency = record['Валюта'] || record['валюта'];
      const availability = record['Наличие'] || record['наличие'] || record['остаток'] || record['количество'];
      const url = record['URL'] || record.url || record['ссылка'];
      const files = record['Файлы'] || record['файлы'];
      const originalPrice = record.originalPrice || record['старая цена'] || record['originalPrice'];
      const isActive = record.isActive || record['активен'] || record['доступен'];
      const isFeatured = record.isFeatured || record['рекомендуемый'];

      if (sku) product.sku = sku;
      if (description) product.description = description;
      if (shortDescription) product.shortDescription = shortDescription;
      if (imageUrl) product.imageUrl = imageUrl;
      
      // Построение полного имени категории из иерархии
      let fullCategoryName = '';
      if (sectionName) fullCategoryName += sectionName;
      if (categoryName) {
        if (fullCategoryName) fullCategoryName += ' > ';
        fullCategoryName += categoryName;
      }
      if (subCategoryName) {
        if (fullCategoryName) fullCategoryName += ' > ';
        fullCategoryName += subCategoryName;
      }
      
      if (fullCategoryName) {
        product.categoryName = fullCategoryName;
      } else if (categoryName) {
        product.categoryName = categoryName;
      }
      
      if (record.categoryId) product.categoryId = parseInt(record.categoryId, 10);
      if (originalPrice) {
        const cleanOriginalPrice = originalPrice.toString().replace(/[^\d.,]/g, '').replace(',', '.');
        product.originalPrice = (parseFloat(cleanOriginalPrice) || 0).toString();
      }
      
      // Обработка наличия товара
      if (availability) {
        const availabilityLower = availability.toString().toLowerCase();
        // Считаем товар в наличии если есть положительное число или "да", "в наличии", "есть"
        const isInStock = /\d+/.test(availability) || 
                         ['да', 'в наличии', 'есть', 'доступен', 'yes', 'available'].includes(availabilityLower);
        product.isActive = isInStock;
        
        // Попытаемся извлечь количество из строки наличия
        const stockMatch = availability.toString().match(/\d+/);
        if (stockMatch) {
          product.stock = parseInt(stockMatch[0], 10);
        }
      } else if (isActive) {
        product.isActive = isActive.toString().toLowerCase() === 'true';
      } else {
        product.isActive = true; // По умолчанию активен
      }
      
      if (isFeatured) product.isFeatured = isFeatured.toString().toLowerCase() === 'true';
      
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
    }).filter(Boolean) as ImportProduct[];

    console.log(`✅ CSV обработан: найдено ${validProducts} валидных товаров`);
    
    // Проверяем, есть ли вообще товары
    if (validProducts === 0) {
      throw new Error('Файл не содержит валидных данных о товарах. Проверьте формат и содержимое файла.');
    }

    return products;
}

/**
 * Парсит содержимое XML-файла в данные о товарах
 */
async function parseXmlFile(content: string): Promise<ImportProduct[]> {
  try {
    // Преобразуем функцию parseString в Promise
    // Создаем типизированную промисифицированную функцию
    const parseXmlAsync = promisify<string, object>(parseString);

    // Исправляем XML для СТАНИКС - добавляем корневой элемент если его нет
    let xmlContent = content.trim();

    // Проверяем если файл начинается с <n> - это формат СТАНИКС
    if (xmlContent.startsWith('<n>') || xmlContent.startsWith('﻿<n>')) {
      console.log("Добавляем корневой элемент для СТАНИКС формата");
      xmlContent = `<stanix_catalog>${xmlContent}</stanix_catalog>`;
    } else if (!xmlContent.startsWith('<?xml') && !xmlContent.startsWith('<yml_catalog') && !xmlContent.startsWith('<catalog')) {
      // Добавляем корневой элемент для других форматов без корня
      xmlContent = `<catalog>${xmlContent}</catalog>`;
    }

    // Парсим XML
    const result = await parseXmlAsync(xmlContent);

    console.log("Ключи верхнего уровня XML:", Object.keys(result));
    console.log("Результат парсинга XML (первые 800 символов):", JSON.stringify(result, null, 2).substring(0, 800) + "...");

    if (!result) {
      throw new Error('XML файл не может быть прочитан');
    }

    // Обработка YML-формата (Яндекс.Маркет)
    if (result.yml_catalog) {
      console.log("Обнаружен формат YML-каталога");
      return parseYmlFormat(result);
    }

    // Обработка формата СТАНИКС
    if (result.stanix_catalog) {
      console.log("Обнаружен формат каталога СТАНИКС");
      return parseStanixFormat(result.stanix_catalog);
    }

    // Обработка обычного формата СТАНИКС с catalog оберткой
    if (result.catalog) {
      console.log("Обнаружен формат каталога СТАНИКС (с catalog оберткой)");
      return parseStanixFormat(result.catalog);
    }

    // Прямая проверка структуры СТАНИКС
    if (result.offer || (result.name && result.categories)) {
      console.log("Обнаружен формат каталога СТАНИКС (прямая структура)");
      return parseStanixFormat(result);
    }

    // Альтернативная проверка - если в result есть элементы как в СТАНИКС
    const hasStanixStructure = Object.keys(result).some(key => 
      ['name', 'company', 'url', 'categories', 'offer'].includes(key)
    );

    if (hasStanixStructure) {
      console.log("Обнаружен формат каталога СТАНИКС (альтернативная структура)");
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
        if (offer.price && offer.price[0]) product.price = (parseFloat(offer.price[0]) || 0).toString();
        else if (offer.oldprice && offer.oldprice[0]) product.price = (parseFloat(offer.oldprice[0]) || 0).toString();
        else product.price = "0";

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

  // Проверяем разные варианты структуры категорий
  if (result.categories && result.categories[0] && result.categories[0].category) {
    const categories = Array.isArray(result.categories[0].category)
      ? result.categories[0].category
      : [result.categories[0].category];

    categories.forEach((cat: any) => {
      if (cat.$ && cat.$.id && cat._) {
        categoriesMap[cat.$.id] = cat._;
      }
    });
  } else if (result.categories && Array.isArray(result.categories)) {
    // Альтернативная структура - categories как массив
    result.categories.forEach((cat: any) => {
      if (cat.$ && cat.$.id && cat._) {
        categoriesMap[cat.$.id] = cat._;
      }
    });
  } else if (result.categories && result.categories.category) {
    // Прямая структура category элементов
    const categories = Array.isArray(result.categories.category)
      ? result.categories.category
      : [result.categories.category];

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

  // Также проверяем все ключи в корне результата для поиска offer элементов
  Object.keys(result).forEach(key => {
    if (key === 'offer' || (typeof result[key] === 'object' && result[key].$ && result[key].$.id && result[key].name)) {
      // Это может быть offer элемент
      if (key !== 'offer') {
        if (!offers.includes(result[key])) {
          offers.push(result[key]);
        }
      }
    }
  });

  // Преобразуем каждый товар
  return offers.map((offer: any, index: number) => {
    const product: ImportProduct = {};

    // Название товара - в формате СТАНИКС используется элемент <n>
    if (offer.n && offer.n[0]) {
      product.name = offer.n[0];
    } else if (offer.name && offer.name[0]) {
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
    } else {
      product.price = "0";
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

/**
 * Парсит содержимое XLSX-файла в данные о товарах
 */
function parseXlsxFile(filePath: string): ImportProduct[] {
  try {
    // Читаем файл Excel как буфер
    const data = readFileSync(filePath);
    const workbook = XLSX.read(data, { type: 'buffer' });

    // Проверяем все листы и выбираем тот, который содержит больше всего данных
    console.log('Доступные листы в файле:', workbook.SheetNames);
    
    let bestSheet = null;
    let maxRows = 0;
    let bestSheetName = '';
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (worksheet) {
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        console.log(`Лист "${sheetName}": ${jsonData.length} строк`);
        
        if (jsonData.length > maxRows) {
          maxRows = jsonData.length;
          bestSheet = worksheet;
          bestSheetName = sheetName;
        }
      }
    }
    
    if (!bestSheet) {
      throw new Error('XLSX файл не содержит данных ни на одном листе');
    }
    
    console.log(`Выбран лист "${bestSheetName}" с ${maxRows} строками`);
    const worksheet = bestSheet;

    // Конвертируем в JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false 
    }) as any[][];

    if (jsonData.length < 2) {
      throw new Error('XLSX файл должен содержать заголовки и хотя бы одну строку данных');
    }

    // Ищем строку с заголовками - может быть в любом месте файла
    let headerRowIndex = -1;
    let headers: string[] = [];
    
    // Расширяем поиск заголовков до первых 50 строк
    for (let i = 0; i < Math.min(50, jsonData.length); i++) {
      const row = jsonData[i] as string[];
      if (row && row.length > 0) {
        // Проверяем если строка содержит типичные заголовки
        const rowStr = row.join(' ').toLowerCase();
        if (rowStr.includes('название') || rowStr.includes('наименование') || 
            rowStr.includes('цена') || rowStr.includes('артикул') ||
            rowStr.includes('товар') || rowStr.includes('продукт') ||
            rowStr.includes('name') || rowStr.includes('price') ||
            rowStr.includes('sku') || rowStr.includes('код') ||
            // Добавляем специфичные для DCK заголовки
            rowStr.includes('модель') || rowStr.includes('model') ||
            rowStr.includes('категория') || rowStr.includes('category') ||
            // Ищем строки с множественными заголовками
            (row.filter(cell => cell && String(cell).trim().length > 0).length >= 3)) {
          
          // Дополнительная проверка - строка должна содержать минимум 3 непустых ячейки
          const nonEmptyCells = row.filter(cell => cell && String(cell).trim().length > 0);
          if (nonEmptyCells.length >= 3) {
            headerRowIndex = i;
            headers = row;
            console.log(`Найдены заголовки в строке ${i + 1}:`, headers);
            break;
          }
        }
      }
    }

    // Если не нашли заголовки, используем первую строку и адаптируемся
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      headers = jsonData[0] as string[];
      console.log('Заголовки не найдены, используем первую строку и адаптивный парсинг');
    }

    // Создаем карту заголовков для гибкого сопоставления
    const headerMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        // Убираем переносы строк и нормализуем заголовок
        const normalizedHeader = header.toLowerCase().trim().replace(/[\r\n]+/g, ' ');
        headerMap[normalizedHeader] = index;
        
        // Также добавляем только первую часть заголовка (до первого переноса)
        const firstPart = header.split(/[\r\n]+/)[0].toLowerCase().trim();
        if (firstPart && firstPart !== normalizedHeader) {
          headerMap[firstPart] = index;
        }
      }
    });

    console.log('XLSX заголовки (строка', headerRowIndex + 1, '):', headers);
    console.log('Карта заголовков:', headerMap);
    console.log('Общее количество строк в файле:', jsonData.length);
    console.log('Строк данных для обработки:', jsonData.length - headerRowIndex - 1);
    
    // Показываем первые и последние несколько строк для диагностики
    console.log('Первые 5 строк данных:');
    for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 6, jsonData.length); i++) {
      console.log(`Строка ${i + 1}:`, jsonData[i]);
    }
    
    if (jsonData.length > headerRowIndex + 10) {
      console.log('Последние 5 строк данных:');
      for (let i = Math.max(headerRowIndex + 1, jsonData.length - 5); i < jsonData.length; i++) {
        console.log(`Строка ${i + 1}:`, jsonData[i]);
      }
    }

    // Функция для получения значения по различным вариантам названий колонок
    const getValue = (row: any[], ...possibleNames: string[]): string => {
      for (const name of possibleNames) {
        const normalizedName = name.toLowerCase().trim();
        const index = headerMap[normalizedName];
        if (index !== undefined && row[index] !== undefined && row[index] !== null) {
          const value = String(row[index]).trim();
          // Пропускаем пустые значения и значения, содержащие только переносы строк
          if (value && value !== '' && !value.match(/^[\r\n\s]*$/)) {
            return value;
          }
        }
      }
      return '';
    };

    // Обрабатываем строки данных (начинаем после найденных заголовков)
    const products: ImportProduct[] = [];

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
        console.log(`Строка ${i + 1}: пропущена - пустая строка`);
        continue; // Пропускаем пустые строки
      }

      const product: ImportProduct = {};

      // Название товара (обязательное поле) - проверяем все колонки если нет четких заголовков
      product.name = getValue(row, 'название', 'наименование', 'name', 'товар', 'продукт', 'item', 'наименование product name', 'product name');
      
      // Если название не найдено по заголовкам, ищем в первых непустых ячейках
      if (!product.name) {
        for (let col = 0; col < Math.min(5, row.length); col++) {
          const cellValue = row[col];
          if (cellValue && String(cellValue).trim() && 
              String(cellValue).trim().length > 3 && 
              !String(cellValue).toLowerCase().includes('новинки') &&
              !String(cellValue).toLowerCase().includes('заказ') &&
              !/^\d+$/.test(String(cellValue).trim())) {
            product.name = String(cellValue).trim();
            break;
          }
        }
      }
      
      if (!product.name) {
        console.warn(`Строка ${i + 1}: пропущена - отсутствует название товара. Содержимое строки:`, row);
        continue;
      }
      
      console.log(`Строка ${i + 1}: обрабатывается товар "${product.name}"`);

      // SKU/Артикул
      product.sku = getValue(row, 'sku', 'артикул', 'код', 'id', 'номер', 'article', 'артикул bojet');
      if (!product.sku) {
        // Генерируем SKU если не указан
        product.sku = `XLSX-${Date.now()}-${i}`;
      }

      // Цена
      const priceStr = getValue(row, 'цена', 'стоимость', 'price', 'cost', 'сумма', 'ррц цена retail price', 'retail price', 'ррц цена', 'розничная цена', 'цена за шт');
      if (priceStr) {
        const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(price) && price > 0) {
          product.price = String(price);
        }
      }

      // Если цена не найдена по заголовкам, ищем числовые значения в строке
      if (!product.price) {
        for (let col = 0; col < row.length; col++) {
          const cellValue = row[col];
          if (cellValue && String(cellValue).trim()) {
            const cleanValue = String(cellValue).replace(/[^\d.,]/g, '').replace(',', '.');
            const price = parseFloat(cleanValue);
            if (!isNaN(price) && price > 0 && price < 10000000) { // разумные пределы цены
              product.price = String(price);
              break;
            }
          }
        }
      }

      // Если цена по-прежнему не найдена, устанавливаем минимальную цену
      if (!product.price) {
        console.warn(`Строка ${i + 1}: товар "${product.name}" - цена не найдена, устанавливаем 1 ₽`);
        product.price = "1";
      }

      // Старая цена
      const oldPriceStr = getValue(row, 'старая цена', 'старая стоимость', 'old price', 'original price');
      if (oldPriceStr) {
        const oldPrice = parseFloat(oldPriceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(oldPrice) && oldPrice > 0) {
          product.originalPrice = String(oldPrice);
        }
      }

      // Описание
      product.description = getValue(row, 'описание', 'description', 'детали', 'характеристики');

      // Короткое описание
      product.shortDescription = getValue(row, 'короткое описание', 'краткое описание', 'short description', 'анонс');

      // Категория - приоритет русским названиям
      product.categoryName = getValue(row, 'категория', 'группа товара', 'category', 'раздел', 'группа', 'категория category', 'группа товара product group', 'product group');
      
      // Если категория не найдена, устанавливаем категорию по умолчанию
      if (!product.categoryName) {
        product.categoryName = 'Инструменты';
      }

      // URL изображения
      product.imageUrl = getValue(row, 'изображение', 'картинка', 'фото', 'image', 'picture', 'photo', 'img', 'url изображения', 'ссылка на изображение', 'image_url', 'image url', 'фотография');

      // Количество на складе
      const stockStr = getValue(row, 'количество', 'остаток', 'склад', 'stock', 'quantity', 'остаток, шт');
      if (stockStr) {
        const stock = parseInt(stockStr);
        if (!isNaN(stock)) {
          product.stock = stock;
        }
      }

      // Активность товара
      const activeStr = getValue(row, 'активен', 'доступен', 'active', 'enabled', 'published');
      if (activeStr) {
        const lowerActive = activeStr.toLowerCase();
        product.isActive = ['да', 'yes', 'true', '1', 'активен', 'доступен'].includes(lowerActive);
      } else {
        product.isActive = true; // По умолчанию активен
      }

      // Рекомендуемый товар
      const featuredStr = getValue(row, 'рекомендуемый', 'популярный', 'featured', 'recommended');
      if (featuredStr) {
        const lowerFeatured = featuredStr.toLowerCase();
        product.isFeatured = ['да', 'yes', 'true', '1', 'рекомендуемый'].includes(lowerFeatured);
      } else {
        product.isFeatured = false;
      }

      // Теги
      product.tag = getValue(row, 'теги', 'метки', 'tags', 'labels');

      // Генерация slug из названия
      if (product.name) {
        product.slug = product.name
          .toLowerCase()
          .replace(/[^a-zа-я0-9\s]/gi, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);

        // Убеждаемся, что slug не пустой
        if (!product.slug || product.slug === '' || product.slug === '-') {
          product.slug = `product-${Date.now()}-${i}`;
        }
      }

      products.push(product);
    }

    console.log(`XLSX обработано товаров: ${products.length}`);
    console.log(`Ожидалось строк данных: ${jsonData.length - headerRowIndex - 1}`);
    console.log(`Фактически обработано товаров: ${products.length}`);
    
    return products;

  } catch (error: any) {
    console.error("XLSX parsing error:", error);
    throw new Error(`Ошибка при разборе XLSX файла: ${error.message}`);
  }
}