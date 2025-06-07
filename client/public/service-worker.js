
// Service Worker без кэширования - АГРЕССИВНАЯ ВЕРСИЯ
const CACHE_NAME = 'NO-CACHE-EVER-' + Date.now();

// При установке немедленно очищаем все кеши
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установка с агрессивной очисткой кэша');
  event.waitUntil(
    Promise.all([
      // Очищаем все возможные кеши
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`Service Worker: Удаление кэша ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }),
      // Немедленно активируемся
      self.skipWaiting()
    ])
  );
});

// При активации снова очищаем все
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активация с полной очисткой');
  
  event.waitUntil(
    Promise.all([
      // Очистка всех кешей
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`Service Worker: Удаление кэша при активации: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }),
      
      // Заставляем всех клиентов использовать новый SW
      self.clients.claim(),
      
      // Перезагружаем все открытые вкладки
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.navigate(client.url);
        });
      })
    ])
  );
});

// Агрессивное отключение кэширования для всех запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  console.log(`Service Worker: Перехват запроса без кэширования: ${event.request.url}`);
  
  // Создаем новый запрос с отключенным кэшированием
  const noCacheRequest = new Request(event.request.url, {
    method: event.request.method,
    headers: new Headers({
      ...Object.fromEntries(event.request.headers.entries()),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }),
    mode: event.request.mode,
    credentials: event.request.credentials,
    cache: 'no-store'
  });
  
  // Добавляем случайный параметр для гарантированного обхода кэша
  url.searchParams.set('_nocache', Date.now().toString());
  url.searchParams.set('_bust', Math.random().toString(36));
  
  const finalRequest = new Request(url.toString(), {
    method: event.request.method,
    headers: noCacheRequest.headers,
    mode: event.request.mode,
    credentials: event.request.credentials,
    cache: 'no-store'
  });
  
  event.respondWith(
    fetch(finalRequest, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    .then(response => {
      // Добавляем заголовки для отключения кэширования в ответе
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      newHeaders.set('Pragma', 'no-cache');
      newHeaders.set('Expires', '-1');
      newHeaders.set('Surrogate-Control', 'no-store');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    })
    .catch(() => {
      return new Response('Нет соединения с сетью. Обновите страницу.', {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    })
  );
});

// Периодическая очистка кэша
setInterval(() => {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}, 10000); // Каждые 10 секунд
