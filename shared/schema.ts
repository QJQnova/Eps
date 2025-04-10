import { pgTable, text, serial, integer, boolean, numeric, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Categories Schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("tool"),
  productCount: integer("product_count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  icon: true,
});

// Products Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  stock: integer("stock").default(0),
  categoryId: integer("category_id").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tag: text("tag"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  sku: true,
  name: true,
  slug: true,
  description: true,
  shortDescription: true,
  price: true,
  originalPrice: true,
  imageUrl: true,
  stock: true,
  categoryId: true,
  isActive: true,
  isFeatured: true,
  tag: true,
});

// CartItems Schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: text("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  quantity: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Создаем типы с преобразованием для работы во фронтенде
export const productInputSchema = z.object({
  sku: z.string().min(1, "SKU обязателен"),
  name: z.string().min(1, "Название обязательно"),
  slug: z.string().min(1, "Slug обязателен"),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  price: z.union([z.number(), z.string().transform(val => parseFloat(val))]).pipe(z.number().min(0)),
  originalPrice: z.union([z.number(), z.string().transform(val => parseFloat(val)), z.null()]).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  stock: z.union([z.number(), z.string().transform(val => parseInt(val, 10)), z.null()]).pipe(z.number().min(0).optional().nullable()),
  categoryId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).pipe(z.number().min(1)),
  isActive: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean()).default(true),
  isFeatured: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean()).default(false),
  tag: z.string().optional().nullable(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Extended schemas for validation
export const productSearchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['featured', 'price-low', 'price-high', 'newest', 'popular']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
});

export const bulkImportSchema = z.array(insertProductSchema);

export type ProductSearchParams = z.infer<typeof productSearchSchema>;
