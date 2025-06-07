
// Агрессивный скрипт против кэширования
(function() {
  'use strict';
  
  console.log('Запуск агрессивного скрипта против кэширования');
  
  // Переопределяем XMLHttpRequest для отключения кэширования
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    
    xhr.open = function(method, url, async, user, password) {
      // Добавляем случайные параметры к URL
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('_xhr_nocache', Date.now().toString());
      urlObj.searchParams.set('_xhr_random', Math.random().toString(36));
      
      const result = originalOpen.call(this, method, urlObj.toString(), async, user, password);
      
      // Добавляем заголовки против кэширования
      this.setRequestHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      this.setRequestHeader('Pragma', 'no-cache');
      this.setRequestHeader('Expires', '0');
      
      return result;
    };
    
    return xhr;
  };
  
  // Отключаем кэширование изображений
  const originalImage = window.Image;
  window.Image = function() {
    const img = new originalImage();
    const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    
    Object.defineProperty(img, 'src', {
      get: originalSrc.get,
      set: function(value) {
        if (value) {
          const url = new URL(value, window.location.origin);
          url.searchParams.set('_img_nocache', Date.now().toString());
          originalSrc.set.call(this, url.toString());
        } else {
          originalSrc.set.call(this, value);
        }
      }
    });
    
    return img;
  };
  
  // Периодическая очистка всех видов кэша
  setInterval(function() {
    // Очистка Application Cache (устаревшая технология)
    if (window.applicationCache) {
      try {
        window.applicationCache.update();
      } catch (e) {}
    }
    
    // Очистка памяти JavaScript
    if (window.gc && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {}
    }
    
    console.log('Периодическая очистка кэша выполнена');
  }, 15000); // Каждые 15 секунд
  
  // Принудительная перезагрузка при долгом бездействии
  let lastActivity = Date.now();
  
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(function(event) {
    document.addEventListener(event, function() {
      lastActivity = Date.now();
    }, true);
  });
  
  setInterval(function() {
    if (Date.now() - lastActivity > 300000) { // 5 минут бездействия
      console.log('Принудительная перезагрузка из-за долгого бездействия');
      window.location.reload();
    }
  }, 60000); // Проверяем каждую минуту
  
})();
