import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "@/lib/cart";

// Принудительное обновление приложения при загрузке
const appVersion = "v1.0.1_15052025";
console.log(`Версия приложения: ${appVersion}`);

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
