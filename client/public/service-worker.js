// Service Worker с отключенным кэшированием
const CACHE_NAME = 'eps-tools-v3-NO-CACHE-' + Date.now();  // Уникальное имя кеша

// При установке сразу очищаем все кеши
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установка без кеширования');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log(`Service Worker: Очищен кеш ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// При активации снова очищаем все кеши и сразу активируемся
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активация с очисткой кеша');
  
  event.waitUntil(
    Promise.all([
      // Очистка всех кешей
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`Service Worker: Очищен кеш при активации: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }),
      
      // Заставляем Service Worker сразу же активироваться
      self.clients.claim()
    ])
  );
});

// Перехват запросов с отключенным кешированием
self.addEventListener('fetch', (event) => {
  // Для API запросов всегда используем сеть и никогда не кешируем
  if (event.request.url.includes('/api/')) {
    console.log(`Service Worker: API запрос без кеширования: ${event.request.url}`);
    
    // Добавляем случайный параметр для обхода кеша
    const url = new URL(event.request.url);
    url.searchParams.append('_nocache', Date.now());
    
    const noCacheRequest = new Request(url.toString(), {
      method: event.request.method,
      headers: new Headers(event.request.headers),
      mode: event.request.mode,
      credentials: event.request.credentials,
      cache: 'no-store'
    });
    
    event.respondWith(fetch(noCacheRequest));
    return;
  }
  
  // Для остальных запросов всегда обращаемся в сеть
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => {
        // Только при отсутствии сети показываем сообщение
        return new Response('Нет соединения с сетью. Обновите страницу.');
      })
  );
});