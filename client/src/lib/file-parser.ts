import { XMLParser } from 'fast-xml-parser';

/**
 * Converts product data from a CSV, JSON or XML file to a standardized format
 */
export async function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'json') {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData)) {
            resolve(jsonData);
          } else {
            reject(new Error('JSON file must contain an array of products'));
          }
        } else if (fileExtension === 'csv') {
          const products = parseCSV(content);
          resolve(products);
        } else if (fileExtension === 'xml') {
          try {
            const products = parseXML(content);
            resolve(products);
          } catch (error: any) {
            reject(new Error('Ошибка при разборе XML: ' + (error.message || 'Неизвестная ошибка')));
          }
        } else {
          reject(new Error('Неподдерживаемый формат файла. Пожалуйста, используйте CSV, JSON или XML.'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('There was an error reading the file.'));
    };
    
    // Проверка по типу файла и расширению
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (
      file.type === 'application/json' || 
      file.type === 'text/csv' || 
      file.type === 'application/xml' || 
      file.type === 'text/xml' ||
      ['json', 'csv', 'xml'].includes(fileExtension || '')
    ) {
      fileReader.readAsText(file);
    } else {
      reject(new Error('Неподдерживаемый тип файла. Пожалуйста, загрузите файл CSV, JSON или XML.'));
    }
  });
}

/**
 * Parse CSV content into an array of objects
 */
function parseCSV(csvContent: string): any[] {
  // Split content into lines
  const lines = csvContent.split(/\r\n|\n/);
  
  // Extract headers from the first line
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse each data row
  const products = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Split data while respecting quoted values
    const values = splitCSVLine(line);
    
    if (values.length !== headers.length) {
      console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`);
      continue;
    }
    
    // Create an object mapping headers to values
    const product: Record<string, any> = {};
    
    for (let j = 0; j < headers.length; j++) {
      const value = values[j].trim();
      const header = headers[j];
      
      // Convert values to appropriate types
      if (header === 'price' || header === 'originalPrice') {
        product[header] = parseFloat(value);
      } 
      else if (header === 'isActive' || header === 'isFeatured') {
        product[header] = value.toLowerCase() === 'true';
      }
      else if (header === 'stock' || header === 'categoryId') {
        product[header] = parseInt(value, 10);
      }
      else {
        product[header] = value;
      }
    }
    
    products.push(product);
  }
  
  return products;
}

/**
 * Split a CSV line respecting quoted values
 */
function splitCSVLine(line: string): string[] {
  const values: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue);
  
  return values;
}

/**
 * Parse XML content into an array of product objects
 */
function parseXML(xmlContent: string): any[] {
  // Создаем экземпляр XMLParser
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_value',
    isArray: (name) => name === 'offer' || name === 'category' || name === 'param'
  });
  
  // Парсим XML
  const result = parser.parse(xmlContent);
  
  // Обработка случаев когда структура не соответствует ожидаемой
  if (!result.yml_catalog || !result.yml_catalog.shop || !result.yml_catalog.shop.offers || !result.yml_catalog.shop.offers.offer) {
    throw new Error('XML не содержит необходимой структуры данных для товаров');
  }
  
  // Создаем карту категорий, если они есть
  const categoriesMap: Record<string, number> = {};
  if (result.yml_catalog.shop.categories && result.yml_catalog.shop.categories.category) {
    const categories = result.yml_catalog.shop.categories.category;
    categories.forEach((cat: any) => {
      if (cat.id && (cat._value || cat.name)) {
        categoriesMap[cat.id] = Number(cat.id);
      }
    });
  }
  
  // Преобразуем данные товаров в формат, совместимый с нашей моделью
  return result.yml_catalog.shop.offers.offer.map((offer: any) => {
    const product: Record<string, any> = {};
    
    // Маппинг полей YML на поля нашей модели продукта
    if (offer.id) product.sku = offer.id.toString();
    if (offer.name || offer._value) product.name = offer.name || offer._value;
    if (offer.model) product.name = offer.model;
    if (offer.description) product.description = offer.description;
    if (offer.price) product.price = parseFloat(offer.price);
    if (offer.oldprice) product.originalPrice = parseFloat(offer.oldprice);
    if (offer.currencyId === 'RUR') product.currency = '₽';
    if (offer.picture) product.imageUrl = offer.picture;
    if (offer.categoryId && categoriesMap[offer.categoryId]) {
      product.categoryId = categoriesMap[offer.categoryId];
    }
    
    // Статус доступности
    if (offer.available !== undefined) {
      product.isActive = offer.available === 'true' || offer.available === true;
      product.stock = product.isActive ? 100 : 0;
    }
    
    // Доп. характеристики
    if (offer.param) {
      const specs: Record<string, string> = {};
      offer.param.forEach((param: any) => {
        if (param.name && (param._value || param.text)) {
          specs[param.name] = param._value || param.text;
        }
      });
      if (Object.keys(specs).length > 0) {
        product.specs = JSON.stringify(specs);
      }
    }
    
    // Создаем slug из названия, если не задан
    if (product.name && !product.slug) {
      const cyrillicPattern = /[^a-zA-Zа-яА-ЯёЁ0-9 ]/g;
      product.slug = product.name
        .toLowerCase()
        .replace(cyrillicPattern, '')
        .replace(/\s+/g, '-');
    }
    
    return product;
  });
}
