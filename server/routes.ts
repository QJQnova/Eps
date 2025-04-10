import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertCartItemSchema, productSearchSchema, bulkImportSchema } from "@shared/schema";
import { parseImportFile } from "./utils/file-parser";
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

  // User Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = validateData(insertUserSchema, req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // In a real application, you'd use proper authentication with JWT or sessions
      // For this demo, we'll just return the user info
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
      const params = validateData(productSearchSchema, req.query);
      const { products, total } = await storage.searchProducts(params);
      
      const page = params.page || 1;
      const limit = params.limit || 12;
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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
      
      // Преобразуем числовые данные
      const modifiedData = {
        ...req.body,
        price: typeof req.body.price === 'string' ? parseFloat(req.body.price) : req.body.price,
        originalPrice: req.body.originalPrice ? 
          (typeof req.body.originalPrice === 'string' ? parseFloat(req.body.originalPrice) : req.body.originalPrice) : null,
        stock: req.body.stock ? 
          (typeof req.body.stock === 'string' ? parseInt(req.body.stock, 10) : req.body.stock) : 0,
        categoryId: typeof req.body.categoryId === 'string' ? parseInt(req.body.categoryId, 10) : req.body.categoryId,
      };
      
      console.log("Modified product data:", modifiedData);
      
      const productData = validateData(insertProductSchema, modifiedData);
      console.log("Validated product data:", productData);
      
      const product = await storage.createProduct(productData);
      console.log("Created product:", product);
      
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      console.log("Received product update data:", req.body);
      const id = parseInt(req.params.id);
      
      // Преобразуем числовые данные
      const modifiedData = {
        ...req.body,
        price: req.body.price !== undefined ? 
          (typeof req.body.price === 'string' ? parseFloat(req.body.price) : req.body.price) : undefined,
        originalPrice: req.body.originalPrice !== undefined ? 
          (typeof req.body.originalPrice === 'string' ? parseFloat(req.body.originalPrice) : req.body.originalPrice) : undefined,
        stock: req.body.stock !== undefined ? 
          (typeof req.body.stock === 'string' ? parseInt(req.body.stock, 10) : req.body.stock) : undefined,
        categoryId: req.body.categoryId !== undefined ? 
          (typeof req.body.categoryId === 'string' ? parseInt(req.body.categoryId, 10) : req.body.categoryId) : undefined,
      };
      
      console.log("Modified product update data:", modifiedData);
      
      const product = await storage.updateProduct(id, modifiedData);
      console.log("Updated product:", product);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
