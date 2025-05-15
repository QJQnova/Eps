// Кэшировать приложение
const CACHE_NAME = 'eps-tools-v2-ОБНОВЛЕНО' + Date.now();  // Добавляем timestamp для гарантированного обновления кеша

// Файлы и ресурсы для кэширования
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  // Принудительный захват клиентов без ожидания перезагрузки
  event.waitUntil(
    Promise.all([
      // Очистка старых кешей
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Удаляем ВСЕ ранее созданные кеши
            return caches.delete(cacheName);
          })
        );
      }),
      
      // Заставляем Service Worker сразу же активироваться
      self.clients.claim()
    ])
  );
});

// Перехват запросов для кэширования и оффлайн-доступа
self.addEventListener('fetch', (event) => {
  // Стратегия "Network First" с кешированием на отказ сети
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если сетевой запрос успешен, обновляем кеш
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // При падении сети пробуем достать из кеша
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Если в кеше нет, показываем резервную страницу для HTML
            if (event.request.url.indexOf('.html') > -1) {
              return caches.match('/offline.html');
            }
            
            // Или создаем пустой ответ
            return new Response('Нет соединения с сетью');
          });
      })
  );
});