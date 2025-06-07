import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "@/lib/cart";

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
