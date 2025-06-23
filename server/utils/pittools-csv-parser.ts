import fs from 'fs';
import { Buffer } from 'buffer';
import iconv from 'iconv-lite';

interface PittoolsProduct {
  imageUrl: string;
  name: string;
  sku: string;
  price: string;
  currency: string;
  availability: string;
  categoryName: string;
  description: string;
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
  
  // Check for Russian characters pattern (Windows-1251)
  const sample = buffer.slice(0, Math.min(1000, buffer.length));
  const win1251Test = iconv.decode(sample, 'win1251');
  if (/[а-яё]/i.test(win1251Test)) {
    return 'win1251';
  }
  
  return 'utf8';
}

function cleanText(text: string): string {
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

function parsePrice(priceStr: string): string {
  if (!priceStr || priceStr.trim() === '') return '0';
  const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? '0' : price.toFixed(2);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

export async function parsePittoolsCSV(filePath: string): Promise<PittoolsProduct[]> {
  console.log(`Начинаю обработку pittools CSV: ${filePath}`);
  
  const buffer = fs.readFileSync(filePath);
  const encoding = detectEncoding(buffer);
  console.log(`Определена кодировка: ${encoding}`);
  
  const content = iconv.decode(buffer, encoding);
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  console.log(`Найдено строк: ${lines.length}`);
  
  const products: PittoolsProduct[] = [];
  let processedCount = 0;
  
  // Analyze first few lines to understand structure
  console.log('Анализ структуры файла:');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const fields = parseCSVLine(lines[i]);
    console.log(`Строка ${i}: ${fields.length} полей`);
    if (fields.length > 0) {
      console.log(`  - Первое поле: "${fields[0].substring(0, 50)}..."`);
      if (fields.length > 1) {
        console.log(`  - Второе поле: "${fields[1].substring(0, 50)}..."`);
      }
    }
  }
  
  // Try different parsing strategies based on file structure
  for (let i = 1; i < lines.length && processedCount < 500; i++) {
    try {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 3) continue;
      
      // Strategy 1: Check if this looks like pittools format
      // Usually: imageUrl, name, sku, price, currency, availability, category, description
      let product: Partial<PittoolsProduct> = {};
      
      // Identify valid product name (not URL, not empty)
      let nameField = '';
      let categoryField = '';
      let priceField = '0';
      let skuField = '';
      let imageField = '';
      
      for (let j = 0; j < fields.length; j++) {
        const field = cleanText(fields[j]);
        
        // Skip URLs as names/categories
        if (field.startsWith('http')) {
          if (!imageField) imageField = field;
          continue;
        }
        
        // Look for price (contains numbers and currency symbols)
        if (/\d+[.,]\d+/.test(field) && /₽|руб|rub/i.test(field)) {
          priceField = field;
          continue;
        }
        
        // Look for SKU (short alphanumeric)
        if (field.length > 2 && field.length < 20 && /^[A-Z0-9.-]+$/i.test(field)) {
          if (!skuField) skuField = field;
          continue;
        }
        
        // Look for category (meaningful Russian text, not too long)
        if (field.length > 2 && field.length < 50 && /[а-яё]/i.test(field) && !categoryField) {
          categoryField = field;
          continue;
        }
        
        // Look for name (meaningful text, longer than category)
        if (field.length > 5 && field.length < 200 && /[а-яёa-z]/i.test(field) && !nameField) {
          nameField = field;
        }
      }
      
      // Only create product if we have minimum required fields
      if (nameField && nameField.length > 2) {
        const finalProduct: PittoolsProduct = {
          imageUrl: imageField || '',
          name: nameField,
          sku: skuField || `AUTO-${Date.now()}-${i}`,
          price: parsePrice(priceField),
          currency: 'RUB',
          availability: 'В наличии',
          categoryName: categoryField || 'Электроинструменты',
          description: `${nameField}${categoryField ? ` - ${categoryField}` : ''}`
        };
        
        products.push(finalProduct);
        processedCount++;
        
        if (processedCount <= 5) {
          console.log(`Обработан товар ${processedCount}:`, {
            name: finalProduct.name.substring(0, 30),
            category: finalProduct.categoryName,
            price: finalProduct.price,
            sku: finalProduct.sku
          });
        }
      }
      
    } catch (error) {
      console.log(`Ошибка обработки строки ${i}:`, error);
      continue;
    }
  }
  
  console.log(`Обработано товаров: ${processedCount} из ${lines.length} строк`);
  return products;
}