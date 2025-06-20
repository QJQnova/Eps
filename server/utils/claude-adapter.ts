import Anthropic from '@anthropic-ai/sdk';
import { parseImportFile } from './file-parser';
import { getPlaceholderImageUrl } from './image-generator';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AdaptedProduct {
  name: string;
  sku: string;
  price: string;
  category: string;
  description: string;
  imageUrl?: string;
}

export async function adaptCatalogWithClaude(filePath: string, fileExtension: string): Promise<{
  success: boolean;
  message: string;
  products?: AdaptedProduct[];
  csvData?: string;
}> {
  try {
    console.log('Начинаем адаптацию каталога с помощью Claude AI...');
    
    // Сначала парсим файл стандартным парсером для получения сырых данных
    const rawProducts = await parseImportFile(filePath, fileExtension);
    
    if (!rawProducts || rawProducts.length === 0) {
      return {
        success: false,
        message: 'Не удалось извлечь данные из файла'
      };
    }

    console.log(`Извлечено ${rawProducts.length} сырых записей для обработки Claude`);

    // Подготавливаем данные для отправки Claude
    const sampleData = rawProducts.slice(0, 10); // Берем первые 10 записей как образец
    const dataForAnalysis = JSON.stringify(sampleData, null, 2);

    const prompt = `Адаптируй каталог товаров для интернет-магазина инструментов. Извлекай только ключевую информацию.

ДАННЫЕ ПОСТАВЩИКА:
${dataForAnalysis}

ИЗВЛЕКАЕМЫЕ ПОЛЯ:
- name: Название товара на русском языке
- sku: Артикул (используй оригинальный или создай понятный)
- category: Категория на основе анализа названия (выбери: Электроинструмент, Ручной инструмент, Садовый инструмент, Сварочные аппараты, Компрессоры, Расходные материалы)
- description: Полное описание с характеристиками
- imageUrl: Всегда оставляй пустым ""

ПРАВИЛА:
1. НАЗВАНИЕ: Переведи на русский, сделай понятным
2. КАТЕГОРИЯ: Анализируй название и выбери точную категорию
3. ОПИСАНИЕ: Объедини все технические данные и характеристики
4. БЕЗ ЦЕН: Цены не обрабатываем
5. БЕЗ ИЗОБРАЖЕНИЙ: imageUrl всегда пустой

Ответ: JSON массив без комментариев.`;

    console.log('Отправляем запрос к Claude API...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: 'Ты эксперт по структурированию данных каталогов товаров. Отвечай только JSON без дополнительных комментариев.',
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Получен ответ от Claude:', responseText.substring(0, 500) + '...');

    // Парсим ответ Claude
    let adaptedProducts: AdaptedProduct[];
    try {
      // Извлекаем JSON из ответа (убираем возможные комментарии)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      adaptedProducts = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Ошибка парсинга ответа Claude:', parseError);
      return {
        success: false,
        message: 'Ошибка обработки ответа от Claude AI'
      };
    }

    if (!Array.isArray(adaptedProducts) || adaptedProducts.length === 0) {
      return {
        success: false,
        message: 'Claude не смог адаптировать данные'
      };
    }

    console.log(`Claude адаптировал ${adaptedProducts.length} товаров`);

    // Если у нас больше записей чем адаптировал Claude, применяем его логику к остальным
    if (rawProducts.length > adaptedProducts.length) {
      console.log('Применяем логику Claude к остальным товарам...');
      
      // Берем паттерн адаптации из первых результатов
      const remainingProducts = rawProducts.slice(adaptedProducts.length);
      
      for (const rawProduct of remainingProducts) {
        const adaptedProduct: AdaptedProduct = {
          name: rawProduct.name || 'Неизвестный товар',
          sku: rawProduct.sku || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          price: '0', // Цены не обрабатываем - всегда 0
          category: rawProduct.categoryName || 'Электроинструмент',
          description: rawProduct.description || rawProduct.shortDescription || '',
          imageUrl: getPlaceholderImageUrl(rawProduct.categoryName || 'Электроинструмент', rawProduct.name || 'Неизвестный товар')
        };
        
        adaptedProducts.push(adaptedProduct);
      }
    }

    // Генерируем CSV данные
    const csvHeader = 'name,sku,price,category,description,imageUrl\n';
    const csvRows = adaptedProducts.map(product => {
      const escapeCsv = (str: string) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      return [
        escapeCsv(product.name),
        escapeCsv(product.sku),
        product.price,
        escapeCsv(product.category),
        escapeCsv(product.description || ''),
        product.imageUrl || ''
      ].join(',');
    });
    
    const csvData = csvHeader + csvRows.join('\n');

    return {
      success: true,
      message: `Успешно адаптировано ${adaptedProducts.length} товаров`,
      products: adaptedProducts,
      csvData
    };

  } catch (error: any) {
    console.error('Ошибка адаптации каталога с Claude:', error);
    return {
      success: false,
      message: `Ошибка обработки: ${error.message}`
    };
  }
}