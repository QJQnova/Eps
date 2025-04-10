import fs from "fs/promises";
import { parse as csvParse } from "csv-parse/sync";
import { InsertProduct } from "@shared/schema";

/**
 * Parses a CSV or JSON file and returns an array of product data
 */
export async function parseImportFile(filePath: string, fileExtension: string): Promise<Partial<InsertProduct>[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    if (fileExtension === '.json') {
      return parseJsonFile(fileContent);
    } else if (fileExtension === '.csv') {
      return parseCsvFile(fileContent);
    } else {
      throw new Error('Unsupported file format. Please use CSV or JSON.');
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
