import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "@/lib/cart";

// Принудительное обновление приложения при загрузке
const appVersion = "v1.0.2_16052025_no_cache";
console.log(`Версия приложения: ${appVersion}`);

// Отключаем кэширование при каждой загрузке приложения
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      console.log(`Очистка кэша: ${cacheName}`);
      caches.delete(cacheName);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
