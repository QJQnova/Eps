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

      // Принудительно добавляем заголовки против кэширования
      queryFn: async ({ queryKey, ...context }) => {
        const url = Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string;

        // Добавляем случайные параметры для обхода кэша
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('_t', Date.now().toString());
        urlObj.searchParams.set('_r', Math.random().toString(36));

        const response = await fetch(urlObj.toString(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      }
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