import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, insertCategorySchema, insertProductSchema, 
  insertCartItemSchema, productSearchSchema, bulkImportSchema,
  orderInputSchema, orderSearchSchema, userSearchSchema,
  shopSettingsSchema, seoSettingsSchema, passwordResetRequestSchema,
  passwordResetSchema
} from "@shared/schema";
import { hashPassword } from "./auth";
import { parseImportFile } from "./utils/file-parser";
import { setupAuth } from "./auth";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Setup file upload
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Store uploads in memory/temp directory
      cb(null, path.join(import.meta.dirname, "../temp"));
    },
    filename: (req, file, cb) => {
      // Give each file a unique name
      const uniqueName = `${randomUUID()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV and JSON files
    if (file.mimetype === "text/csv" || file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and JSON files are allowed"));
      // @ts-ignore
      cb(null, false);
    }
  }
});

// Create temp directory if it doesn't exist
const ensureTempDir = async () => {
  const tempDir = path.join(import.meta.dirname, "../temp");
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create temp directory:", error);
  }
};

// Helper function for validation error handling
const validateData = <T>(schema: z.ZodType<T>, data: any): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }
  return result.data;
};

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureTempDir();
  
  // Настройка авторизации
  setupAuth(app);

  // User Routes для администрирования
  // Middleware для проверки прав администратора
  const isAdmin = (req: Request, res: Response, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Недостаточно прав" });
    }
    
    next();
  };
  
  // Получение списка пользователей (только для админов)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const params = validateData(userSearchSchema, req.query);
      
      const roleFilter = params.role === "all" || params.role === null ? undefined : params.role;
      const isActiveFilter = params.isActive === "all" || params.isActive === null ? undefined : params.isActive === true;
      
      // Преобразуем параметры к правильным типам для устранения ошибок TypeScript
      const result = await storage.searchUsers({
        query: params.query,
        role: roleFilter as string | undefined,
        isActive: isActiveFilter as boolean | undefined,
        page: Number(params.page),
        limit: Number(params.limit)
      });
      
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Получение отдельного пользователя по ID
  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      // Не возвращаем пароль
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Создание нового пользователя администратором
  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Особая валидация для админского создания пользователя
      const userData = validateData(insertUserSchema, req.body);
      
      // Хеширование пароля и создание пользователя
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Не возвращаем пароль
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Обновление пользователя
  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData = req.body;
      
      // Если в запросе есть пароль, хешируем его
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const user = await storage.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      // Не возвращаем пароль
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Изменение статуса пользователя (активация/деактивация)
  app.patch("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "Поле isActive должно быть булевым значением" });
      }
      
      const user = await storage.updateUser(id, { isActive });
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      // Не возвращаем пароль
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Удаление пользователя
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Проверяем, что админ не пытается удалить себя
      if (req.user && id === req.user.id) {
        return res.status(400).json({ message: "Невозможно удалить собственную учетную запись" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Category Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = validateData(insertCategorySchema, req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const category = await storage.updateCategory(id, updateData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(400).json({ message: "Category has products and cannot be deleted" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product Routes
  app.get("/api/products", async (req, res) => {
    try {
      // Создаем собственную схему поиска с преобразованием типов
      const customSearchSchema = z.object({
        categoryId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).optional(),
        query: z.string().optional(),
        sort: z.enum(["featured", "price-low", "price-high", "newest", "popular"]).optional(),
        minPrice: z.union([z.number(), z.string().transform(val => parseFloat(val))]).optional(),
        maxPrice: z.union([z.number(), z.string().transform(val => parseFloat(val))]).optional(),
        page: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).transform(val => val || 1),
        limit: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).transform(val => val || 12)
      });
      
      const params = customSearchSchema.parse(req.query);
      console.log("Search params:", params);
      
      const { products, total } = await storage.searchProducts(params);
      
      const totalPages = Math.ceil(total / params.limit);
      
      res.status(200).json({
        products,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages
        }
      });
    } catch (error: any) {
      console.error("Error searching products:", error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ message: `Validation error: ${errorMessages}` });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const featuredProducts = await storage.getFeaturedProducts();
      res.status(200).json(featuredProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/categories/:categoryId/products", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const products = await storage.getProductsByCategoryId(categoryId);
      res.status(200).json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      console.log("Received product data:", req.body);
      
      // Создаем собственную схему валидации с прямым преобразованием типов
      const customProductSchema = z.object({
        sku: z.string().min(1, "SKU is required"),
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().optional().nullable(),
        shortDescription: z.string().optional().nullable(),
        price: z.union([z.number(), z.string().transform(val => parseFloat(val))]).pipe(z.number().min(0)),
        originalPrice: z.union([z.number(), z.string().transform(val => parseFloat(val)), z.null()]).optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        stock: z.union([z.number(), z.string().transform(val => parseInt(val, 10)), z.null()]).pipe(z.number().min(0).optional().nullable()),
        categoryId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).pipe(z.number().min(1)),
        isActive: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean().optional()).default(true),
        isFeatured: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean().optional()).default(false),
        tag: z.string().optional().nullable(),
      });
            
      const productData = customProductSchema.parse(req.body);      
      console.log("Validated product data:", productData);
      
      const product = await storage.createProduct(productData);
      console.log("Created product:", product);
      
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ message: `Validation error: ${errorMessages}` });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      console.log("Received product update data:", req.body);
      const id = parseInt(req.params.id);
      
      // Создаем собственную схему валидации с прямым преобразованием типов
      const customProductUpdateSchema = z.object({
        sku: z.string().min(1, "SKU is required").optional(),
        name: z.string().min(1, "Name is required").optional(),
        slug: z.string().min(1, "Slug is required").optional(),
        description: z.string().optional().nullable(),
        shortDescription: z.string().optional().nullable(),
        price: z.union([z.number(), z.string().transform(val => parseFloat(val))]).pipe(z.number().min(0)).optional(),
        originalPrice: z.union([z.number(), z.string().transform(val => parseFloat(val)), z.null()]).optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        stock: z.union([z.number(), z.string().transform(val => parseInt(val, 10)), z.null()]).pipe(z.number().min(0).optional()).optional(),
        categoryId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).pipe(z.number().min(1)).optional(),
        isActive: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean()).optional(),
        isFeatured: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean()).optional(),
        tag: z.string().optional().nullable(),
      });
      
      const modifiedData = customProductUpdateSchema.parse(req.body);
      console.log("Modified product update data:", modifiedData);
      
      const product = await storage.updateProduct(id, modifiedData);
      console.log("Updated product:", product);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ message: `Validation error: ${errorMessages}` });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk Import
  app.post("/api/products/bulk-import", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    try {
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      // Parse the file based on its extension
      const parsedProducts = await parseImportFile(filePath, fileExt);
      
      try {
        // Validate all products
        const validatedProducts = validateData(bulkImportSchema, parsedProducts);
        
        // Import products
        const result = await storage.bulkImportProducts(validatedProducts);
        
        // Clean up the temporary file
        await fs.unlink(filePath);
        
        res.status(200).json(result);
      } catch (validationError: any) {
        // Clean up the temporary file on error too
        await fs.unlink(filePath);
        throw validationError;
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cart Routes
  app.get("/api/cart/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const items = await storage.getCartItemWithProduct(cartId);
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
      
      res.status(200).json({
        items,
        subtotal,
        itemCount: items.reduce((count, item) => count + item.quantity, 0)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cart/items", async (req, res) => {
    try {
      const cartItemData = validateData(insertCartItemSchema, req.body);
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/cart/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      
      const cartItem = await storage.updateCartItemQuantity(id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.status(200).json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeFromCart(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      await storage.clearCart(cartId);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order Routes
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = validateData(orderInputSchema, req.body);
      
      // Получаем товары из корзины
      const cartItems = await storage.getCartItemWithProduct(orderData.cartId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Корзина пуста" });
      }
      
      // Создаем заказ
      const order = await storage.createOrder(orderData, cartItems);
      
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Путь к специфическим маршрутам должен быть перед путями с параметрами
  // Маршрут для получения заказов пользователя
  app.get("/api/orders/my-orders", async (req, res) => {
    try {
      // Проверяем, авторизован ли пользователь
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Не авторизован" });
      }
      
      // Получаем ID пользователя из сессии
      const userId = req.user.id;
      
      // В реальном приложении здесь будет фильтрация заказов по ID пользователя
      // Пока используем заглушку, возвращаем все заказы, так как у нас нет поля userId в схеме заказов
      const orders = await storage.getAllOrders();
      
      // Добавляем проверку на null перед обращением к createdAt
      res.status(200).json({ 
        orders: orders.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 10) // Ограничиваем количество заказов для демонстрации
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      // Схема поиска с преобразованием типов
      const customSearchSchema = z.object({
        query: z.string().optional(),
        status: z.enum(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).transform(val => val || 1),
        limit: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).transform(val => val || 10)
      });
      
      const params = customSearchSchema.parse(req.query);
      
      // Получаем заказы с пагинацией
      const { orders, total } = await storage.searchOrders(params);
      
      const totalPages = Math.ceil(total / params.limit);
      
      res.status(200).json({
        orders,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ message: `Ошибка валидации: ${errorMessages}` });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }
      
      res.status(200).json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Статус обязателен" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }
      
      res.status(200).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Маршруты для настроек
  // Получить настройки магазина
  app.get("/api/admin/settings/shop", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getShopSettings();
      res.status(200).json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Обновить настройки магазина
  app.put("/api/admin/settings/shop", isAdmin, async (req, res) => {
    try {
      // Убедимся что все булевы поля определены
      const data = {
        ...req.body,
        enableRegistration: typeof req.body.enableRegistration === 'boolean' ? req.body.enableRegistration : true,
        enableCheckout: typeof req.body.enableCheckout === 'boolean' ? req.body.enableCheckout : true,
        maintenanceMode: typeof req.body.maintenanceMode === 'boolean' ? req.body.maintenanceMode : false
      };
      
      const settingsData = validateData(shopSettingsSchema, data);
      const success = await storage.updateShopSettings(settingsData);
      
      if (!success) {
        return res.status(500).json({ message: "Не удалось обновить настройки магазина" });
      }
      
      res.status(200).json({ message: "Настройки магазина успешно обновлены" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Получить настройки SEO
  app.get("/api/admin/settings/seo", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSeoSettings();
      res.status(200).json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Обновить настройки SEO
  app.put("/api/admin/settings/seo", isAdmin, async (req, res) => {
    try {
      const settingsData = validateData(seoSettingsSchema, req.body);
      const success = await storage.updateSeoSettings(settingsData);
      
      if (!success) {
        return res.status(500).json({ message: "Не удалось обновить SEO настройки" });
      }
      
      res.status(200).json({ message: "SEO настройки успешно обновлены" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Маршруты для восстановления пароля
  // 1. Запрос на восстановление пароля - требует только email
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = validateData(passwordResetRequestSchema, req.body);
      
      // Найти пользователя по email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // В целях безопасности не сообщаем, что пользователь не найден
        return res.status(200).json({ 
          success: true, 
          message: "Если указанный email существует, на него отправлена инструкция по восстановлению пароля" 
        });
      }
      
      // Создаем токен для сброса пароля
      const resetToken = await storage.createPasswordResetToken(user.id);
      
      // Нормально в реальном приложении здесь нужно отправлять email с токеном,
      // но так как у нас нет возможности использовать SendGrid, просто возвращаем токен в ответе
      // В реальном приложении, мы бы НЕ возвращали токен, а отправляли его по email
      
      res.status(200).json({ 
        success: true, 
        message: "Если указанный email существует, на него отправлена инструкция по восстановлению пароля",
        // Только для тестирования, в реальном приложении не возвращаем токен
        token: resetToken.token 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  
  // 2. Проверка токена сброса пароля
  app.get("/api/password-reset/verify", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Токен не предоставлен" 
        });
      }
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ 
          success: false, 
          message: "Недействительный или истекший токен сброса пароля" 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Токен действителен" 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  
  // 3. Установка нового пароля
  app.post("/api/password-reset/reset", async (req, res) => {
    try {
      const { token, password } = validateData(passwordResetSchema, req.body);
      
      // Проверяем токен
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ 
          success: false, 
          message: "Недействительный или истекший токен сброса пароля" 
        });
      }
      
      // Хешируем новый пароль
      const hashedPassword = await hashPassword(password);
      
      // Обновляем пароль пользователя
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Помечаем токен как использованный
      await storage.markPasswordResetTokenAsUsed(token);
      
      // Удаляем все истекшие токены для очистки базы данных
      await storage.deleteExpiredPasswordResetTokens();
      
      res.status(200).json({ 
        success: true, 
        message: "Пароль успешно обновлен" 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
