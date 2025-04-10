/**
 * Форматирование цены в рублях
 * @param price - цена (число или строка)
 * @returns отформатированная цена с символом рубля
 */
export function formatPrice(price: number | string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price));
}

/**
 * Форматирование даты в российском формате
 * @param dateString - строка с датой
 * @returns отформатированная дата
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Получение названия статуса заказа на русском
 * @param status - статус заказа на английском
 * @returns название статуса на русском
 */
export function getOrderStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Ожидает обработки",
    processing: "В обработке",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменен",
  };
  return statusMap[status] || status;
}

/**
 * Получение класса цвета для статуса заказа
 * @param status - статус заказа на английском
 * @returns класс Tailwind CSS для стилизации
 */
export function getOrderStatusColor(status: string): string {
  const statusColorMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return statusColorMap[status] || "bg-gray-100 text-gray-800";
}

/**
 * Форматирование числа товаров с правильными окончаниями
 * @param count - количество товаров
 * @returns строка с правильным склонением
 */
export function formatItemCount(count: number): string {
  // Для 11-14 всегда "товаров"
  if (count % 100 > 10 && count % 100 < 15) return `${count} товаров`;
  
  // Для остальных чисел используем стандартные правила
  switch (count % 10) {
    case 1: return `${count} товар`;
    case 2:
    case 3:
    case 4: return `${count} товара`;
    default: return `${count} товаров`;
  }
}