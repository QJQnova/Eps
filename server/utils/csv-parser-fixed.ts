import * as fs from 'fs/promises';
import * as path from 'path';
import * as iconv from 'iconv-lite';

interface CSVProduct {
  imageUrl?: string;
  name: string;
  sku: string;
  price: string;
  currency?: string;
  availability?: string;
  categoryName?: string;
  subcategory?: string;
  section?: string;
  url?: string;
  description?: string;
  shortDescription?: string;
  originalPrice?: string;
  stock?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tag?: string;
  slug?: string;
}

function detectEncoding(buffer: Buffer): string {
  // Check for BOM markers
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf8';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf16be';
  }

  // Check for Russian characters typical in Windows-1251
  const russianBytes = [0xC0, 0xC1, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xCB, 0xCC, 0xCD, 0xCE, 0xCF,
                       0xD0, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE, 0xDF,
                       0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, 0xED, 0xEE, 0xEF,
                       0xF0, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF];
  
  let russianByteCount = 0;
  const sampleSize = Math.min(buffer.length, 1000);
  
  for (let i = 0; i < sampleSize; i++) {
    if (russianBytes.includes(buffer[i])) {
      russianByteCount++;
    }
  }

  // If more than 1% are Russian bytes, likely Windows-1251
  if (russianByteCount / sampleSize > 0.01) {
    return 'windows-1251';
  }

  return 'utf8';
}

function cleanText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ');
}

function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePrice(priceStr: string): string {
  if (!priceStr) return '0';
  const cleaned = priceStr.toString().replace(/[^\d.,]/g, '');
  const price = parseFloat(cleaned.replace(',', '.'));
  return isNaN(price) ? '0' : price.toString();
}

export async function parseCSVFile(filePath: string): Promise<CSVProduct[]> {
  try {
    console.log(`Парсинг CSV файла: ${filePath}`);
    
    // Read file as buffer first
    const fileBuffer = await fs.readFile(filePath);
    console.log(`Размер файла: ${fileBuffer.length} байт`);
    
    // Detect encoding
    const encoding = detectEncoding(fileBuffer);
    console.log(`Определена кодировка: ${encoding}`);
    
    // Convert to string with proper encoding
    let content: string;
    if (encoding === 'windows-1251') {
      content = iconv.decode(fileBuffer, 'windows-1251');
    } else {
      content = fileBuffer.toString(encoding as BufferEncoding);
    }
    
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    console.log(`Всего строк: ${lines.length}`);
    
    if (lines.length === 0) {
      throw new Error('CSV файл пуст');
    }
    
    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log(`Заголовки:`, headers);
    
    // Map headers to expected fields (case-insensitive)
    const headerMap: Record<string, string> = {};
    headers.forEach((header, index) => {
      const cleaned = header.toLowerCase().trim();
      if (cleaned.includes('изображ') || cleaned.includes('картинк') || cleaned === 'imageurl') {
        headerMap[index] = 'imageUrl';
      } else if (cleaned.includes('назван') || cleaned === 'name') {
        headerMap[index] = 'name';
      } else if (cleaned.includes('артикул') || cleaned === 'sku') {
        headerMap[index] = 'sku';
      } else if (cleaned.includes('цена') || cleaned === 'price') {
        headerMap[index] = 'price';
      } else if (cleaned.includes('валют') || cleaned === 'currency') {
        headerMap[index] = 'currency';
      } else if (cleaned.includes('наличи') || cleaned === 'availability') {
        headerMap[index] = 'availability';
      } else if (cleaned.includes('категор') || cleaned === 'category') {
        headerMap[index] = 'categoryName';
      } else if (cleaned.includes('подкатегор') || cleaned === 'subcategory') {
        headerMap[index] = 'subcategory';
      } else if (cleaned.includes('раздел') || cleaned === 'section') {
        headerMap[index] = 'section';
      } else if (cleaned.includes('ссылк') || cleaned === 'url') {
        headerMap[index] = 'url';
      } else if (cleaned.includes('описан') || cleaned === 'description') {
        headerMap[index] = 'description';
      }
    });
    
    const products: CSVProduct[] = [];
    let processedCount = 0;
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length < 3) continue; // Skip rows with too few columns
        
        const product: CSVProduct = {
          name: '',
          sku: '',
          price: '0'
        };
        
        // Map values based on header mapping
        values.forEach((value, index) => {
          const field = headerMap[index];
          if (field && value) {
            const cleanValue = cleanText(value);
            if (field === 'price' || field === 'originalPrice') {
              (product as any)[field] = parsePrice(cleanValue);
            } else if (field === 'isActive' || field === 'isFeatured') {
              (product as any)[field] = cleanValue.toLowerCase() === 'true' || cleanValue === '1';
            } else {
              (product as any)[field] = cleanValue;
            }
          }
        });
        
        // Generate defaults
        if (!product.name && values.length > 1) {
          product.name = cleanText(values[1]) || `Товар ${i}`;
        }
        if (!product.sku && values.length > 2) {
          product.sku = cleanText(values[2]) || `SKU-${i}`;
        }
        if (!product.price && values.length > 3) {
          product.price = parsePrice(values[3]);
        }
        
        // Set defaults
        product.slug = generateSlug(product.name || product.sku);
        product.isActive = product.isActive ?? true;
        product.isFeatured = product.isFeatured ?? false;
        
        // Ensure we have minimum required fields
        if (product.name && product.sku) {
          products.push(product);
          processedCount++;
        }
        
      } catch (error) {
        console.log(`Ошибка обработки строки ${i}:`, error);
        continue;
      }
    }
    
    console.log(`Успешно обработано ${processedCount} товаров из ${lines.length - 1} строк`);
    return products;
    
  } catch (error) {
    console.error('Ошибка парсинга CSV:', error);
    throw new Error(`Ошибка парсинга CSV: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  // Detect separator - check for semicolon or comma
  const separator = line.includes(';') ? ';' : ',';
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === separator && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}