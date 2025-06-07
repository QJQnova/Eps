import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "@/lib/cart";

// Агрессивная очистка всех видов кэша
const appVersion = "v2.0.0_NO_CACHE_AGGRESSIVE_" + Date.now();
console.log(`Версия приложения: ${appVersion}`);

// Принудительная очистка всех типов кэша
const clearAllCaches = async () => {
  try {
    // Очистка Service Worker кэшей
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`Удаление кэша: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }
    
    // Очистка localStorage
    if (typeof Storage !== 'undefined') {
      localStorage.clear();
      console.log('localStorage очищен');
    }
    
    // Очистка sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
      console.log('sessionStorage очищен');
    }
    
    // Очистка IndexedDB
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                deleteReq.onsuccess = () => {
                  console.log(`IndexedDB ${db.name} удалена`);
                  resolve();
                };
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
            return Promise.resolve();
          })
        );
      } catch (error) {
        console.log('Не удалось очистить IndexedDB:', error);
      }
    }
    
    // Принудительное обновление страницы каждые 30 секунд
    setTimeout(() => {
      window.location.reload();
    }, 30000);
    
  } catch (error) {
    console.error('Ошибка при очистке кэшей:', error);
  }
};

// Запускаем очистку
clearAllCaches();

// Отключаем кэширование для fetch запросов
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [resource, config] = args;
  
  // Добавляем параметры для отключения кэширования
  const newConfig = {
    ...config,
    cache: 'no-store',
    headers: {
      ...config?.headers,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  };
  
  // Добавляем случайный параметр к URL
  let url = resource;
  if (typeof resource === 'string') {
    const urlObj = new URL(resource, window.location.origin);
    urlObj.searchParams.set('_nocache', Date.now().toString());
    urlObj.searchParams.set('_bust', Math.random().toString(36));
    url = urlObj.toString();
  }
  
  return originalFetch(url, newConfig);
};

// Добавляем мета-теги для отключения кэширования
const addNoCacheMetaTags = () => {
  const metaTags = [
    { httpEquiv: 'Cache-Control', content: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
    { httpEquiv: 'Pragma', content: 'no-cache' },
    { httpEquiv: 'Expires', content: '-1' },
    { httpEquiv: 'Surrogate-Control', content: 'no-store' }
  ];
  
  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    if (tag.httpEquiv) meta.setAttribute('http-equiv', tag.httpEquiv);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });
};

addNoCacheMetaTags();

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
