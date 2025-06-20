import * as fs from "fs/promises";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";
import { parseString } from "xml2js";
import { promisify } from "util";
import XLSX from "xlsx";

// Расширенный тип для работы с импортом
interface ImportProduct extends Partial<InsertProduct> {
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

    // For text-based files, read as UTF-8
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
    // Парсим CSV-файл с заголовками
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map((record: any, index: number) => {
      // Конвертируем строковые значения в соответствующие типы
      const product: ImportProduct = {};

      // Проверяем, что запись не пустая
      const hasAnyData = Object.values(record).some(value => value && String(value).trim() !== '');
      if (!hasAnyData) {
        console.warn(`Строка ${index + 2} пропущена - пустая строка`);
        return null;
      }

      // Обязательные поля с более гибкой проверкой названий колонок
      const name = record.name || record['название'] || record.Name || record['Название'] || record['Наименование'] || record['наименование'];
      const price = record.price || record['цена'] || record.Price || record['Цена'];

      if (!name || !price) {
        console.warn(`Строка ${index + 2} пропущена - отсутствует название или цена`);
        return null;
      }

      // Маппинг полей с преобразованием типов
      product.name = name;
      product.price = parseFloat(price).toString();

      // Опциональные поля с поддержкой русских заголовков
      const sku = record.sku || record['артикул'] || record.SKU || record['Артикул'];
      const description = record.description || record['описание'] || record.Description || record['Описание'];
      const shortDescription = record.shortDescription || record['короткое описание'] || record['краткое описание'];
      const imageUrl = record.imageUrl || record['изображение'] || record['картинка'] || record['Изображение'];
      const categoryName = record.categoryName || record['категория'] || record.category || record['Категория'];
      const originalPrice = record.originalPrice || record['старая цена'] || record['originalPrice'];
      const stock = record.stock || record['остаток'] || record['количество'] || record.Stock || record['Остаток'];
      const isActive = record.isActive || record['активен'] || record['доступен'];
      const isFeatured = record.isFeatured || record['рекомендуемый'];

      if (sku) product.sku = sku;
      if (description) product.description = description;
      if (shortDescription) product.shortDescription = shortDescription;
      if (imageUrl) product.imageUrl = imageUrl;
      if (categoryName) product.categoryName = categoryName;
      if (record.categoryId) product.categoryId = parseInt(record.categoryId, 10);
      if (originalPrice) product.originalPrice = parseFloat(originalPrice).toString();
      if (stock) product.stock = parseInt(stock, 10);
      if (isActive) product.isActive = isActive.toLowerCase() === 'true';
      if (isFeatured) product.isFeatured = isFeatured.toLowerCase() === 'true';
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
        product.price = priceValue;
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

/**
 * Парсит содержимое XLSX-файла в данные о товарах
 */
function parseXlsxFile(filePath: string): ImportProduct[] {
  try {
    // Читаем файл Excel как буфер
    const data = readFileSync(filePath);
    const workbook = XLSX.read(data, { type: 'buffer' });

    // Получаем первый лист
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('XLSX файл не содержит листов');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Не удалось прочитать первый лист XLSX файла');
    }

    // Конвертируем в JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false 
    }) as any[][];

    if (jsonData.length < 2) {
      throw new Error('XLSX файл должен содержать заголовки и хотя бы одну строку данных');
    }

    // Ищем строку с заголовками - может быть не первая строка
    let headerRowIndex = -1;
    let headers: string[] = [];
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i] as string[];
      if (row && row.length > 0) {
        // Проверяем если строка содержит типичные заголовки
        const rowStr = row.join(' ').toLowerCase();
        if (rowStr.includes('название') || rowStr.includes('наименование') || 
            rowStr.includes('цена') || rowStr.includes('артикул') ||
            rowStr.includes('товар') || rowStr.includes('продукт') ||
            rowStr.includes('name') || rowStr.includes('price')) {
          headerRowIndex = i;
          headers = row;
          break;
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
        console.warn(`Строка ${i + 1}: пропущена - отсутствует название товара`);
        continue;
      }

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

      // Если цена не найдена, пропускаем товар с предупреждением
      if (!product.price) {
        console.warn(`Строка ${i + 1}: товар "${product.name}" пропущен - отсутствует валидная цена`);
        continue;
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
    return products;

  } catch (error: any) {
    console.error("XLSX parsing error:", error);
    throw new Error(`Ошибка при разборе XLSX файла: ${error.message}`);
  }
}