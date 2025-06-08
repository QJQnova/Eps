import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Настройка авторизации
  setupAuth(app);

  // Basic product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json({ products, total: products.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const items = await storage.getCartItemWithProduct(cartId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/test", requireAdmin, async (req, res) => {
    res.json({ message: "Admin access confirmed", user: req.user });
  });

  // Bulk import route
  app.post("/api/products/bulk-import", requireAdmin, async (req, res) => {
    try {
      res.status(200).json({
        message: "Импорт функция временно отключена",
        success: 0,
        failed: 0
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({ message: "Ошибка импорта: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}