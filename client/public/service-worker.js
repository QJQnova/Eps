// Кэшировать приложение
const CACHE_NAME = 'eps-tools-v1';

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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов для кэширования и оффлайн-доступа
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кэшированный ответ, если он есть
        if (response) {
          return response;
        }

        // В противном случае, делаем сетевой запрос
        return fetch(event.request)
          .then((response) => {
            // Проверка, что ответ валидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Копируем ответ, так как он может использоваться только один раз
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Если все запросы завершились неудачно, показываем резервную страницу
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/offline.html');
        }
      })
  );
});