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
          } catch (error) {
            reject(new Error('Ошибка при разборе XML: ' + error.message));
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
