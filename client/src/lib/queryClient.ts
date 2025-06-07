import { QueryClient } from "@tanstack/react-query";

// Создаем QueryClient с полностью отключенным кэшированием
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Полное отключение кэширования
      staleTime: 0, // Данные всегда считаются устаревшими
      gcTime: 0, // Немедленное удаление из памяти
      refetchOnMount: 'always', // Всегда перезапрашивать при монтировании
      refetchOnWindowFocus: 'always', // Всегда перезапрашивать при фокусе
      refetchOnReconnect: 'always', // Всегда перезапрашивать при переподключении
      retry: false, // Отключаем повторные попытки для ускорения
      networkMode: 'always', // Всегда делать запросы

      
    },
    mutations: {
      // Отключаем кэширование для мутаций
      networkMode: 'always',
      retry: false
    }
  }
});

// Периодически очищаем кэш QueryClient
setInterval(() => {
  queryClient.clear();
  queryClient.invalidateQueries();
  queryClient.removeQueries();
}, 5000); // Каждые 5 секунд

// Добавляем глобальный обработчик для принудительного обновления
window.addEventListener('focus', () => {
  queryClient.invalidateQueries();
});

window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    queryClient.invalidateQueries();
  }
});