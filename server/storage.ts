import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import {
  User, InsertUser, Category, InsertCategory, Product, InsertProduct, 
  ProductInput, CartItem, InsertCartItem, ProductSearchParams, Order, 
  OrderInput, OrderItem, OrderSearchParams,
  users, categories, products, cartItems, orders, orderItems
} from "@shared/schema";
import { and, eq, like, between, desc, asc, sql, isNull, gte, lte } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session Store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategoryId(categoryId: number): Promise<Product[]>;
  searchProducts(params: ProductSearchParams): Promise<{ products: Product[], total: number }>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: ProductInput): Promise<Product>;
  updateProduct(id: number, product: Partial<ProductInput>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  bulkImportProducts(products: InsertProduct[]): Promise<{ success: number, failed: number }>;
  
  // Cart operations
  getCartItems(cartId: string): Promise<CartItem[]>;
  getCartItemWithProduct(cartId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(cartId: string): Promise<boolean>;
  
  // Order operations
  createOrder(orderInput: OrderInput, cartItems: (CartItem & { product: Product })[]): Promise<Order>;
  getOrderById(id: number): Promise<(Order & { items: (OrderItem & { product?: Product })[] }) | undefined>;
  getAllOrders(): Promise<Order[]>;
  searchOrders(params: OrderSearchParams): Promise<{ orders: Order[], total: number }>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderItemsWithProducts(orderId: number): Promise<(OrderItem & { product?: Product })[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions',
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }
  
  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    // Проверяем, есть ли товары в этой категории
    const productsCount = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id));
    
    if (productsCount[0].count > 0) {
      return false;
    }
    
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
  
  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.slug, slug));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }
  
  async searchProducts(params: ProductSearchParams): Promise<{ products: Product[], total: number }> {
    const conditions: any[] = [];

    // Базовый запрос для поиска товаров
    let query = db.select().from(products);
    
    // Фильтрация по поисковому запросу
    if (params.query) {
      query = query.where(
        sql`(${products.name} ILIKE ${'%' + params.query + '%'} OR ${products.description} ILIKE ${'%' + params.query + '%'})`
      );
    }
    
    // Фильтрация по категории
    if (params.categoryId) {
      query = query.where(eq(products.categoryId, params.categoryId));
    }
    
    // Фильтрация по цене
    if (params.minPrice !== undefined) {
      query = query.where(sql`${products.price} >= ${params.minPrice.toString()}`);
    }
    
    if (params.maxPrice !== undefined) {
      query = query.where(sql`${products.price} <= ${params.maxPrice.toString()}`);
    }
    
    // Подсчет общего количества товаров для пагинации
    const countQuery = sql`SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await db.execute(countQuery);
    const total = parseInt(countResult.rows[0]?.count || '0');
    
    // Сортировка
    if (params.sort) {
      switch (params.sort) {
        case "price-low":
          query = query.orderBy(asc(products.price));
          break;
        case "price-high":
          query = query.orderBy(desc(products.price));
          break;
        case "newest":
          query = query.orderBy(desc(products.id));
          break;
        case "popular":
          query = query.orderBy(desc(products.isFeatured));
          query = query.orderBy(desc(products.id));
          break;
        case "featured":
        default:
          query = query.orderBy(desc(products.isFeatured));
          query = query.orderBy(asc(products.name));
          break;
      }
    }
    
    // Пагинация
    const offset = (params.page - 1) * params.limit;
    query = query.limit(params.limit).offset(offset);
    
    const productsResult = await query;
    
    return {
      products: productsResult,
      total
    };
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isFeatured, true));
  }
  
  async createProduct(productInput: ProductInput): Promise<Product> {
    // Оптимизация: преобразуем ProductInput в InsertProduct
    const insertProduct: InsertProduct = {
      sku: productInput.sku,
      name: productInput.name,
      slug: productInput.slug,
      description: productInput.description || null,
      shortDescription: productInput.shortDescription || null,
      price: productInput.price,
      originalPrice: productInput.originalPrice || null,
      imageUrl: productInput.imageUrl || null,
      stock: productInput.stock || null,
      categoryId: productInput.categoryId,
      isActive: productInput.isActive ?? true,
      isFeatured: productInput.isFeatured ?? false,
      tag: productInput.tag || null,
    };
    
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }
  
  async updateProduct(id: number, updateData: Partial<ProductInput>): Promise<Product | undefined> {
    // Преобразовать ProductInput в структуру для БД
    const updateValues: Partial<InsertProduct> = { 
      ...updateData,
      description: updateData.description ?? undefined,
      shortDescription: updateData.shortDescription ?? undefined,
      originalPrice: updateData.originalPrice ?? undefined,
      imageUrl: updateData.imageUrl ?? undefined,
      stock: updateData.stock ?? undefined,
      tag: updateData.tag ?? undefined
    };
    
    const result = await db.update(products)
      .set(updateValues)
      .where(eq(products.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }
  
  async bulkImportProducts(productsToImport: InsertProduct[]): Promise<{ success: number, failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const productData of productsToImport) {
      try {
        // Преобразовать в формат, подходящий для createProduct
        const productInput: ProductInput = {
          sku: productData.sku,
          name: productData.name,
          slug: productData.slug,
          description: productData.description || null,
          shortDescription: productData.shortDescription || null,
          price: productData.price,
          originalPrice: productData.originalPrice || null,
          imageUrl: productData.imageUrl || null,
          stock: productData.stock || null,
          categoryId: productData.categoryId,
          isActive: productData.isActive ?? true,
          isFeatured: productData.isFeatured ?? false,
          tag: productData.tag || null,
        };
        
        await this.createProduct(productInput);
        success++;
      } catch (error) {
        console.error("Ошибка при импорте товара:", error);
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  // Cart operations
  async getCartItems(cartId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }
  
  async getCartItemWithProduct(cartId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db.select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      addedAt: cartItems.addedAt,
      product: products
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))
    .innerJoin(products, eq(cartItems.productId, products.id));
    
    return result;
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Проверяем, существует ли уже такой товар в корзине
    const existingItem = await db.select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, insertCartItem.cartId),
          eq(cartItems.productId, insertCartItem.productId)
        )
      );
    
    if (existingItem.length > 0) {
      // Если товар уже в корзине, обновим его количество
      const newQuantity = existingItem[0].quantity + (insertCartItem.quantity || 1);
      const result = await db.update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      
      return result[0];
    }
    
    // Иначе добавим новый товар в корзину
    const validatedItem = {
      ...insertCartItem,
      quantity: insertCartItem.quantity || 1, // Если количество не указано, установим 1
      addedAt: new Date()
    };
    
    const result = await db.insert(cartItems).values(validatedItem).returning();
    return result[0];
  }
  
  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async clearCart(cartId: string): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .returning();
    
    return true; // Даже если корзина пуста, считаем операцию успешной
  }
  
  // Order operations
  async createOrder(orderInput: OrderInput, cartItems: (CartItem & { product: Product })[]): Promise<Order> {
    // Рассчитаем общую сумму заказа
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0
    );
    
    // Создаем заказ в транзакции
    // Note: для PostgreSQL используем транзакции
    const orderResult = await db.transaction(async (tx) => {
      // 1. Создаем основную запись заказа
      const orderData = {
        userId: null, // TODO: Добавить поддержку userId для авторизованных пользователей
        customerName: orderInput.customerName,
        customerEmail: orderInput.customerEmail,
        customerPhone: orderInput.customerPhone,
        address: orderInput.address,
        city: orderInput.city,
        postalCode: orderInput.postalCode,
        paymentMethod: orderInput.paymentMethod,
        paymentStatus: "pending",
        totalAmount,
        status: "pending",
        notes: orderInput.notes || null,
        createdAt: new Date()
      };
      
      const [order] = await tx.insert(orders).values(orderData).returning();
      
      // 2. Добавляем элементы заказа
      for (const item of cartItems) {
        const orderItemData = {
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          productPrice: parseFloat(item.product.price.toString()),
          quantity: item.quantity,
          totalPrice: item.quantity * parseFloat(item.product.price.toString())
        };
        
        await tx.insert(orderItems).values(orderItemData);
      }
      
      return order;
    });
    
    // 3. Очищаем корзину после создания заказа
    await this.clearCart(orderInput.cartId);
    
    return orderResult;
  }
  
  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { product?: Product })[] }) | undefined> {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id));
    
    if (orderResult.length === 0) {
      return undefined;
    }
    
    const order = orderResult[0];
    
    // Получаем элементы заказа с информацией о товарах
    const orderItemsWithProduct = await db.select({
      orderItem: orderItems,
      product: products
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .leftJoin(products, eq(orderItems.productId, products.id));
    
    const items = orderItemsWithProduct.map(row => ({
      ...row.orderItem,
      product: row.product
    }));
    
    return {
      ...order,
      items
    };
  }
  
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  
  async searchOrders(params: OrderSearchParams): Promise<{ orders: Order[], total: number }> {
    // Базовый запрос для поиска заказов
    let query = db.select().from(orders);
    
    // Фильтрация по поисковому запросу
    if (params.query) {
      query = query.where(
        sql`(${orders.customerName} ILIKE ${'%' + params.query + '%'} OR 
             ${orders.customerEmail} ILIKE ${'%' + params.query + '%'} OR 
             ${orders.customerPhone} ILIKE ${'%' + params.query + '%'})`
      );
    }
    
    // Фильтрация по статусу
    if (params.status && params.status !== 'all') {
      query = query.where(eq(orders.status, params.status));
    }
    
    // Фильтрация по датам
    if (params.startDate) {
      query = query.where(sql`${orders.createdAt} >= ${new Date(params.startDate)}`);
    }
    
    if (params.endDate) {
      query = query.where(sql`${orders.createdAt} <= ${new Date(params.endDate)}`);
    }
    
    // Подсчет общего количества заказов для пагинации
    const countQuery = sql`SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await db.execute(countQuery);
    const total = parseInt(countResult.rows[0]?.count || '0');
    
    // Сортировка по дате создания (новые в начале)
    query = query.orderBy(desc(orders.createdAt));
    
    // Пагинация
    const offset = (params.page - 1) * params.limit;
    query = query.limit(params.limit).offset(offset);
    
    const ordersResult = await query;
    
    return {
      orders: ordersResult,
      total
    };
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  
  async getOrderItemsWithProducts(orderId: number): Promise<(OrderItem & { product?: Product })[]> {
    const result = await db.select({
      orderItem: orderItems,
      product: products
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .leftJoin(products, eq(orderItems.productId, products.id));
    
    return result.map(row => ({
      ...row.orderItem,
      product: row.product
    }));
  }
}

export const storage = new DatabaseStorage();