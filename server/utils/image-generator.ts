// Генератор заглушек изображений для товаров
export function generateProductPlaceholder(category: string, productName: string): string {
  const categoryIcons: Record<string, string> = {
    'Электроинструмент': `
      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
      <path d="M8 12C8 14.21 9.79 16 12 16S16 14.21 16 12" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    `,
    'Ручной инструмент': `
      <path d="M14.7 6.3C15.1 5.9 15.1 5.3 14.7 4.9L19.1 0.5C19.5 0.1 19.5 -0.5 19.1 -0.9C18.7 -1.3 18.1 -1.3 17.7 -0.9L13.3 3.5C12.9 3.1 12.3 3.1 11.9 3.5L4.9 10.5C4.5 10.9 4.5 11.5 4.9 11.9L12.1 19.1C12.5 19.5 13.1 19.5 13.5 19.1L20.5 12.1C20.9 11.7 20.9 11.1 20.5 10.7L14.7 6.3Z" fill="currentColor"/>
    `,
    'Садовый инструмент': `
      <path d="M7 2V13H10V10A1 1 0 0 1 11 9H13A1 1 0 0 1 14 10V13H17V2H7Z" fill="currentColor"/>
      <path d="M19 15H5C4.45 15 4 15.45 4 16V18C4 18.55 4.45 19 5 19H19C19.55 19 20 18.55 20 18V16C20 15.45 19.55 15 19 15Z" fill="currentColor"/>
      <path d="M8 21V19H16V21C16 21.55 15.55 22 15 22H9C8.45 22 8 21.55 8 21Z" fill="currentColor"/>
    `,
    'Сварочные аппараты': `
      <path d="M3 14H21L19 12H5L3 14Z" fill="currentColor"/>
      <path d="M5 8L7 6L17 6L19 8V12H5V8Z" fill="currentColor"/>
      <circle cx="8" cy="9" r="1" fill="white"/>
      <circle cx="16" cy="9" r="1" fill="white"/>
      <path d="M6 14L8 18H16L18 14" stroke="currentColor" strokeWidth="2" fill="none"/>
    `,
    'Компрессоры': `
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="6" fill="currentColor"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
      <path d="M12 3V6" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 18V21" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 12H6" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 12H21" stroke="currentColor" strokeWidth="2"/>
    `,
    'Расходные материалы': `
      <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor"/>
      <rect x="5" y="6" width="14" height="2" fill="white"/>
      <rect x="5" y="9" width="14" height="2" fill="white"/>
      <rect x="5" y="12" width="10" height="2" fill="white"/>
      <rect x="5" y="15" width="8" height="2" fill="white"/>
    `
  };

  const colors = {
    'Электроинструмент': '#EF4444', // красный
    'Ручной инструмент': '#3B82F6', // синий
    'Садовый инструмент': '#10B981', // зеленый
    'Сварочные аппараты': '#F59E0B', // оранжевый
    'Компрессоры': '#8B5CF6', // фиолетовый
    'Расходные материалы': '#6B7280' // серый
  };

  const categoryColor = (colors as any)[category] || '#6B7280';
  const iconPath = (categoryIcons as any)[category] || categoryIcons['Расходные материалы'];
  
  // Создаем первые буквы названия товара для отображения
  const initials = productName
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  const svgContent = `
    <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <!-- Фон с градиентом -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${categoryColor}20"/>
          <stop offset="100%" style="stop-color:${categoryColor}40"/>
        </linearGradient>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${categoryColor}"/>
          <stop offset="100%" style="stop-color:${categoryColor}CC"/>
        </linearGradient>
      </defs>
      
      <!-- Фон -->
      <rect width="400" height="300" fill="url(#bgGradient)"/>
      
      <!-- Иконка категории -->
      <g transform="translate(200, 120)" fill="url(#iconGradient)">
        <g transform="scale(3) translate(-12, -12)">
          ${iconPath}
        </g>
      </g>
      
      <!-- Инициалы товара -->
      <text x="200" y="220" text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="24" 
            font-weight="bold" 
            fill="${categoryColor}">
        ${initials}
      </text>
      
      <!-- Название категории -->
      <text x="200" y="245" text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="14" 
            fill="${categoryColor}AA">
        ${category}
      </text>
      
      <!-- Логотип ЭПС -->
      <text x="200" y="280" text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="12" 
            font-weight="bold" 
            fill="${categoryColor}80">
        ЭПС
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

// Функция для получения заглушки по категории товара
export function getPlaceholderImageUrl(category: string, productName: string): string {
  return generateProductPlaceholder(category, productName);
}