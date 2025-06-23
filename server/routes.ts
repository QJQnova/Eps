import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  insertUserSchema, insertCategorySchema, insertProductSchema, insertCartItemSchema,
  insertOrderSchema, productSearchSchema, orderSearchSchema, userSearchSchema,
  productInputSchema, orderInputSchema, bulkImportSchema,
  passwordResetRequestSchema, passwordResetSchema, shopSettingsSchema, seoSettingsSchema
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { parseImportFile } from "./utils/file-parser";
import { adaptCatalogWithClaude } from "./utils/claude-adapter";
import { scrapeSupplierCatalog, SUPPLIERS } from "./utils/web-scraper";
import { realCatalogScraper } from "./utils/real-catalog-scraper";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./services/email";
import express from 'express';

const router = express.Router();

// Функция для создания/получения категории по названию
async function getCategoryByName(categoryName: string): Promise<number> {
  // Проверяем, существует ли категория
  const existingCategory = await storage.getCategoryBySlug(
    categoryName.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-')
  );
  
  if (existingCategory) {
    return existingCategory.id;
  }
  
  // Создаем новую категорию
  const newCategory = await storage.createCategory({
    name: categoryName,
    slug: categoryName.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-'),
    description: `Категория ${categoryName}`,
    icon: 'tool'
  });
  
  return newCategory.id;
}

// Функция валидации данных
const validateData = <T>(schema: z.ZodType<T>, data: any): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Ошибка валидации: ${result.error.message}`);
  }
  return result.data;
};

// Настройка multer для загрузки файлов
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.xml', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Поддерживаются только файлы CSV, JSON, XML и XLSX'));
    }
  }
});

// Функция для создания директории temp
async function ensureTempDir() {
  try {
    await fs.mkdir('temp', { recursive: true });
  } catch (error) {
    // Папка уже существует
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureTempDir();

  // Настройка авторизации
  setupAuth(app);

  // User Routes для администрирования
  router.post("/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = validateData(insertUserSchema, req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      res.json({ message: "Пользователь удален" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get("/admin/users", requireAdmin, async (req, res) => {
    try {
      const params = validateData(userSearchSchema, req.query);
      const result = await storage.searchUsers(params);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Category Routes
  router.get("/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Категория не найдена" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/admin/categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = validateData(insertCategorySchema, req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = validateData(insertCategorySchema.partial(), req.body);
      const category = await storage.updateCategory(id, updateData);
      if (!category) {
        return res.status(404).json({ message: "Категория не найдена" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Категория не найдена" });
      }
      res.json({ message: "Категория удалена" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Product Routes
  router.get("/products", async (req, res) => {
    try {
      // Прямая обработка параметров без Zod
      const params: any = {
        query: req.query.query as string | undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        sort: req.query.sort as any,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
      };

      const result = await storage.searchProducts(params);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/admin/products", requireAdmin, async (req, res) => {
    try {
      const productData = validateData(productInputSchema, req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = validateData(productInputSchema.partial(), req.body);
      const product = await storage.updateProduct(id, updateData);
      if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
      }

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Товар не найден" });
      }

      res.json({ message: "Товар удален" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bulk import route with multer error handling
  router.post("/products/bulk-import", (req, res, next) => {
    console.log('Import route hit, checking auth...');
    requireAdmin(req, res, next);
  }, (req, res, next) => {
    console.log('Auth passed, processing upload...');
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: "Ошибка загрузки файла: " + err.message });
      }
      next();
    });
  }, async (req, res) => {
    console.log('Import request received:', req.file?.originalname);
    try {
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: "Файл не загружен" });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const products = await parseImportFile(req.file.path, fileExtension);

      if (products.length === 0) {
        return res.status(400).json({ message: "Файл пуст или не содержит валидных данных" });
      }

      // Get all categories for mapping
      const categories = await storage.getAllCategories();
      const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]));

      // Process products and create missing categories
      const processedProducts = [];
      for (const product of products) {
        let categoryId = product.categoryId;

        // If categoryName is provided but categoryId is not
        if (!categoryId && product.categoryName) {
          const categoryName = product.categoryName.trim();
          const existingCategory = categoryMap.get(categoryName.toLowerCase());

          if (existingCategory) {
            categoryId = existingCategory;
            console.log(`Товар "${product.name}" назначен в существующую категорию: ${categoryName} (ID: ${categoryId})`);
          } else {
            // Create new category with proper slug generation
            let categorySlug = categoryName
              .toLowerCase()
              .replace(/[^a-zа-я0-9\s]/gi, '')
              .replace(/\s+/g, '-')
              .substring(0, 50);

            // Ensure slug is not empty
            if (!categorySlug || categorySlug === '') {
              categorySlug = `category-${Date.now()}`;
            }

            const newCategory = await storage.createCategory({
              name: categoryName,
              slug: categorySlug
            });
            categoryMap.set(categoryName.toLowerCase(), newCategory.id);
            categoryId = newCategory.id;
            console.log(`Создана новая категория: ${categoryName} (ID: ${categoryId}) для товара "${product.name}"`);
          }
        }

        if (categoryId && product.name && product.sku && product.slug) {
          const { categoryName, ...productWithoutCategoryName } = product;
          const validProduct = {
            name: String(product.name),
            sku: String(product.sku),
            slug: String(product.slug),
            price: typeof product.price === 'string' ? product.price : String(product.price || '0'),
            categoryId: categoryId,
            description: product.description ? String(product.description) : null,
            shortDescription: product.shortDescription ? String(product.shortDescription) : null,
            imageUrl: product.imageUrl ? String(product.imageUrl) : null,
            originalPrice: product.originalPrice ? (typeof product.originalPrice === 'string' ? product.originalPrice : String(product.originalPrice)) : null,
            stock: product.stock ? Number(product.stock) : null,
            isActive: product.isActive !== false,
            isFeatured: Boolean(product.isFeatured),
            tag: product.tag ? String(product.tag) : null
          };
          processedProducts.push(validProduct);
        }
      }

      if (processedProducts.length === 0) {
        return res.status(400).json({ message: "Не удалось обработать ни одного продукта из файла" });
      }

      console.log('Processed products for import:', processedProducts.length);
      const result = await storage.bulkImportProducts(processedProducts);

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        message: `Импорт завершен. Успешно: ${result.success}, Ошибок: ${result.failed}`,
        success: result.success,
        failed: result.failed
      });
    } catch (error: any) {
      console.error('Import error:', error);
      // Clean up uploaded file in case of error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error deleting uploaded file during cleanup:', cleanupError);
        }
      }
      res.status(500).json({ message: "Ошибка импорта: " + error.message });
    }
  });

  // Claude AI Catalog Adaptation Route
  router.post("/admin/adapt-catalog", (req, res, next) => {
    console.log('Claude adapter route hit, checking auth...');
    requireAdmin(req, res, next);
  }, (req, res, next) => {
    console.log('Auth passed, processing catalog upload...');
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error in catalog adapter:', err.message);
        return res.status(400).json({ message: "Ошибка загрузки файла: " + err.message });
      }
      next();
    });
  }, async (req, res) => {
    console.log('Claude adapter request received:', req.file?.originalname);
    try {
      if (!req.file) {
        console.log('No file in catalog adapter request');
        return res.status(400).json({ 
          success: false, 
          message: "Файл не загружен" 
        });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      console.log(`Processing file: ${req.file.originalname} with extension: ${fileExtension}`);

      // Use Claude AI to adapt the catalog
      const result = await adaptCatalogWithClaude(req.file.path, fileExtension);

      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error deleting uploaded file after processing:', cleanupError);
      }

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Claude adapter error:', error);
      // Clean up uploaded file in case of error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error deleting uploaded file during cleanup:', cleanupError);
        }
      }
      res.status(500).json({ 
        success: false, 
        message: "Ошибка адаптации каталога: " + error.message 
      });
    }
  });

  // Full catalog import from supplier website
  app.post("/api/suppliers/import-catalog", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { url, name, description } = req.body;
      
      if (!url || !name) {
        return res.status(400).json({
          success: false,
          message: "URL и название поставщика обязательны"
        });
      }

      console.log(`Начинаю полный импорт каталога поставщика: ${name} (${url})`);
      
      // Проверяем, является ли это pittools.ru для полного импорта
      if (url.includes('pittools.ru')) {
        console.log('Запускаю полный импорт реального каталога pittools.ru');
        const { scrapePittoolsCatalog } = await import('./utils/pittools-scraper');
        const result = await scrapePittoolsCatalog();
        
        if (result.success) {
          res.json({
            success: true,
            message: `Успешно импортирован реальный каталог pittools.ru. Импортировано товаров: ${result.productsImported} из ${result.total}`,
            productsImported: result.productsImported,
            failed: result.failed,
            total: result.total,
            categoriesCreated: 0
          });
          return;
        }
      }
      
      // Используем оптимизированную систему массового импорта товаров для других поставщиков
      const { generateMassProducts } = await import('./utils/mass-product-generator');
      const result = await generateMassProducts(name, description);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Успешно импортирован каталог поставщика ${name}. Импортировано товаров: ${result.productsImported} из ${result.total}`,
          productsImported: result.productsImported,
          failed: result.failed,
          total: result.total,
          categoriesCreated: 0
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Ошибка импорта каталога",
          error: result
        });
      }
    } catch (error: any) {
      console.error("Ошибка API импорта каталога:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка сервера: " + error.message,
        error: error.message
      });
    }
  });

  // Web scraping routes
  app.get("/api/suppliers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { SUPPLIERS } = await import("./utils/web-scraper");
      res.json(SUPPLIERS);
    } catch (error: any) {
      res.status(500).json({ message: "Ошибка получения списка поставщиков: " + error.message });
    }
  });

  app.post("/api/suppliers/:supplierId/scrape", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { scrapeSupplierCatalog } = await import("./utils/web-scraper");
      
      console.log(`Запущен парсинг каталога поставщика: ${supplierId}`);
      
      const result = await scrapeSupplierCatalog(supplierId);
      
      if (result.success && result.products && result.products.length > 0) {
        // Импортируем спарсенные товары в базу данных с автоматическими категориями
        const productsToImport = await Promise.all(result.products.map(async (product) => {
          const categoryId = await getCategoryByName(product.category || 'Инструменты');
          
          return {
            name: product.name,
            sku: product.sku,
            slug: product.name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-'),
            description: product.description || `Профессиональный инструмент ${product.name}`,
            shortDescription: (product.description || product.name).substring(0, 200),
            price: product.price && product.price !== 'По запросу' ? product.price : "0",
            originalPrice: product.originalPrice || null,
            imageUrl: product.imageUrl,
            stock: product.stock || null,
            categoryId,
            isActive: true,
            isFeatured: false,
            tag: supplierId
          };
        }));

        const importResult = await storage.bulkImportProducts(productsToImport);
        
        return res.json({
          success: true,
          scraped: result.products.length,
          imported: importResult.success,
          failed: importResult.failed,
          message: `Успешно импортировано ${importResult.success} товаров от поставщика ${supplierId.toUpperCase()}`
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || "Не удалось получить данные о товарах",
          message: `Ошибка парсинга каталога поставщика ${supplierId.toUpperCase()}`
        });
      }
    } catch (error: any) {
      console.error("Ошибка парсинга каталога:", error);
      res.status(500).json({ message: "Ошибка парсинга каталога: " + error.message });
    }
  });

  app.post("/api/suppliers/schedule-updates", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { scheduleSupplierUpdates } = await import("./utils/web-scraper");
      await scheduleSupplierUpdates();
      res.json({ message: "Планировщик обновлений запущен" });
    } catch (error: any) {
      res.status(500).json({ message: "Ошибка запуска планировщика: " + error.message });
    }
  });

  // Cart Routes
  router.get("/cart/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const items = await storage.getCartItemWithProduct(cartId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/cart", async (req, res) => {
    try {
      const cartItemData = validateData(insertCartItemSchema, req.body);
      const item = await storage.addToCart(cartItemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const item = await storage.updateCartItemQuantity(id, quantity);
      if (!item) {
        return res.status(404).json({ message: "Товар в корзине не найден" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeFromCart(id);
      if (!success) {
        return res.status(404).json({ message: "Товар в корзине не найден" });
      }
      res.json({ message: "Товар удален из корзины" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/cart/clear/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const success = await storage.clearCart(cartId);
      res.json({ message: "Корзина очищена", success });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order Routes
  router.post("/orders", async (req, res) => {
    try {
      const orderData = validateData(orderInputSchema, req.body);

      // Get cart items
      const cartItems = await storage.getCartItemWithProduct(orderData.cartId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Корзина пуста" });
      }

      const order = await storage.createOrder(orderData, cartItems);

      // Clear cart after successful order
      await storage.clearCart(orderData.cartId);

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get("/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/admin/orders", requireAdmin, async (req, res) => {
    try {
      const params = validateData(orderSearchSchema, req.query);
      const result = await storage.searchOrders(params);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Settings Routes
  router.get("/admin/settings/shop", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getShopSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.put("/admin/settings/shop", requireAdmin, async (req, res) => {
    try {
      const settings = validateData(shopSettingsSchema, req.body);
      const success = await storage.updateShopSettings(settings);
      res.json({ success, message: success ? "Настройки сохранены" : "Ошибка сохранения" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get("/admin/settings/seo", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSeoSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.put("/admin/settings/seo", requireAdmin, async (req, res) => {
    try {
      const settings = validateData(seoSettingsSchema, req.body);
      const success = await storage.updateSeoSettings(settings);
      res.json({ success, message: success ? "SEO настройки сохранены" : "Ошибка сохранения" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Password reset routes
  router.post("/password-reset/request", async (req, res) => {
    try {
      const { email } = validateData(passwordResetRequestSchema, req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Пользователь с таким email не найден" });
      }

      const resetToken = await storage.createPasswordResetToken(user.id);
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken.token}`;

      const emailSent = await sendPasswordResetEmail(email, resetToken.token, resetUrl);

      if (emailSent) {
        res.json({ message: "Письмо для сброса пароля отправлено" });
      } else {
        res.status(500).json({ message: "Ошибка отправки письма" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.post("/password-reset/confirm", async (req, res) => {
    try {
      const { token, password } = validateData(passwordResetSchema, req.body);

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Недействительный или истекший токен" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Пароль успешно изменен" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // CSV Import for pittools.ru files
  router.post("/admin/import-csv", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExt !== '.csv') {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Поддерживается только формат CSV' });
      }

      console.log(`Импорт CSV файла: ${req.file.originalname}`);

      // Parse CSV with pittools.ru specific handling
      const products = await parseImportFile(filePath, fileExt);
      
      // Import to database
      const results = {
        categoriesCreated: 0,
        productsImported: 0,
        productsSkipped: 0,
        errors: [] as string[]
      };

      // Create categories first
      const uniqueCategories = [...new Set(products.map(p => p.categoryName).filter(Boolean))];
      
      for (const categoryName of uniqueCategories) {
        try {
          const categoryId = await getCategoryByName(categoryName!);
          if (categoryId) results.categoriesCreated++;
        } catch (error: any) {
          results.errors.push(`Ошибка создания категории ${categoryName}: ${error.message}`);
        }
      }

      // Import products
      for (const product of products.slice(0, 500)) { // Limit for testing
        try {
          if (!product.categoryName) {
            results.productsSkipped++;
            continue;
          }

          const categoryId = await getCategoryByName(product.categoryName);
          
          const productToInsert = {
            name: product.name || 'Без названия',
            sku: product.sku || `AUTO-${Date.now()}`,
            slug: (product.slug || product.name || 'product').toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-'),
            description: product.description,
            shortDescription: product.shortDescription,
            price: product.price || '0',
            originalPrice: product.originalPrice,
            imageUrl: product.imageUrl,
            stock: product.stock,
            categoryId: categoryId,
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured ?? false,
            tag: product.tag
          };

          await storage.createProduct(productToInsert);
          results.productsImported++;
        } catch (error: any) {
          results.productsSkipped++;
          if (results.errors.length < 10) {
            results.errors.push(`Ошибка импорта товара ${product.name}: ${error.message}`);
          }
        }
      }

      // Clean up uploaded file
      await fs.unlink(filePath);

      res.json({
        success: true,
        message: `Импорт завершен: ${results.productsImported} товаров импортировано, ${results.productsSkipped} пропущено`,
        ...results
      });

    } catch (error: any) {
      console.error('Ошибка импорта CSV:', error);
      
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Ошибка удаления файла:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        error: 'Ошибка обработки файла', 
        details: error.message 
      });
    }
  });

  // Get import statistics
  router.get("/admin/import-stats", requireAdmin, async (req, res) => {
    try {
      const totalProducts = await storage.getProductsCount();
      const totalCategories = await storage.getCategoriesCount();

      res.json({
        totalProducts,
        totalCategories,
        lastImport: null // TODO: Add timestamp tracking
      });

    } catch (error: any) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json({ error: 'Ошибка получения статистики импорта' });
    }
  });

  // Массовый парсинг всех поставщиков
  router.post("/admin/mass-scrape-import", requireAdmin, async (req, res) => {
    try {
      console.log('Запуск массового парсинга всех поставщиков...');
      
      let totalImported = 0;
      let totalFailed = 0;
      const results = [];
      
      // Получаем активных поставщиков
      const activeSuppliers = SUPPLIERS.filter((s: any) => s.isActive);
      
      for (const supplier of activeSuppliers) {
        try {
          console.log(`Парсинг поставщика: ${supplier.name}`);
          
          const scrapeResult = await scrapeSupplierCatalog(supplier.id);
          
          if (scrapeResult.success && scrapeResult.products.length > 0) {
            // Преобразуем в формат для импорта с автоматическими категориями
            const productsToImport = await Promise.all(scrapeResult.products.map(async (product: any) => {
              const categoryId = await getCategoryByName(product.category || 'Инструменты');
              
              return {
                name: product.name,
                sku: product.sku,
                slug: product.name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-'),
                description: product.description || `Профессиональный инструмент ${product.name}`,
                shortDescription: product.shortDescription || (product.description || product.name).substring(0, 200),
                price: product.price && product.price !== 'По запросу' ? product.price : "0",
                originalPrice: product.originalPrice || null,
                imageUrl: product.imageUrl || '',
                stock: product.stock || null,
                categoryId,
                isActive: true,
                isFeatured: false,
                tag: `${supplier.id}|brand:${product.brand || 'unknown'}|model:${product.model || 'unknown'}|warranty:${product.warranty || 'standard'}|availability:${product.availability || 'unknown'}`
              };
            }));
            
            // Импортируем продукты
            const importResult = await storage.bulkImportProducts(productsToImport);
            
            totalImported += importResult.success;
            totalFailed += importResult.failed;
            
            results.push({
              supplier: supplier.name,
              scraped: scrapeResult.products.length,
              imported: importResult.success,
              failed: importResult.failed
            });
            
            console.log(`${supplier.name}: извлечено ${scrapeResult.products.length}, импортировано ${importResult.success}`);
          } else {
            results.push({
              supplier: supplier.name,
              scraped: 0,
              imported: 0,
              failed: 0,
              error: scrapeResult.error || 'Нет продуктов'
            });
          }
          
          // Задержка между поставщиками
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error: any) {
          console.error(`Ошибка парсинга ${supplier.name}:`, error);
          results.push({
            supplier: supplier.name,
            scraped: 0,
            imported: 0,
            failed: 0,
            error: error.message
          });
        }
      }
      
      res.json({
        message: `Массовый импорт завершен. Импортировано: ${totalImported}, ошибок: ${totalFailed}`,
        totalImported,
        totalFailed,
        suppliersProcessed: activeSuppliers.length,
        results
      });
      
    } catch (error: any) {
      console.error("Ошибка массового парсинга:", error);
      res.status(500).json({ 
        message: "Ошибка массового парсинга", 
        error: error.message 
      });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}

