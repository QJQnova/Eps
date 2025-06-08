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

// НЕ перехватываем запросы - позволяем всем проходить напрямую
self.addEventListener('fetch', (event) => {
  // НИЧЕГО НЕ ДЕЛАЕМ - позволяем всем запросам проходить как обычно
  return;
});