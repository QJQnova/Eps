import { 
  users, categories, products, cartItems, orders, orderItems,
  type User, type InsertUser, 
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type CartItem, type InsertCartItem,
  type ProductSearchParams, type ProductInput,
  type Order, type InsertOrder, type OrderInput, type OrderSearchParams,
  type OrderItem, type InsertOrderItem
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  
  // IDs for auto-increment
  private currentUserId: number;
  private currentCategoryId: number;
  private currentProductId: number;
  private currentCartItemId: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentCartItemId = 1;
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin",
      isAdmin: true
    });
    
    // Initialize with some categories
    this.seedCategories();
  }
  
  // Seed initial categories
  private seedCategories() {
    const initialCategories: InsertCategory[] = [
      {
        name: "Электростанции дизельные",
        slug: "diesel-power-stations",
        description: "Дизельные генераторы для обеспечения автономного электроснабжения",
        icon: "power"
      },
      {
        name: "Электроинструмент",
        slug: "power-tools",
        description: "Профессиональные электрические инструменты",
        icon: "drill"
      },
      {
        name: "Мотобуры",
        slug: "motor-drills",
        description: "Мотобуры для сверления отверстий в грунте",
        icon: "drill"
      },
      {
        name: "Сварочные аппараты",
        slug: "welding-machines",
        description: "Промышленные сварочные аппараты различных типов",
        icon: "flash"
      },
      {
        name: "Садовая техника",
        slug: "garden-equipment",
        description: "Оборудование для сада и ландшафтных работ",
        icon: "tree"
      },
      {
        name: "Электростанции бензиновые",
        slug: "petrol-power-stations",
        description: "Бензиновые генераторы для автономного электроснабжения",
        icon: "power"
      },
      {
        name: "Строительное оборудование",
        slug: "construction-equipment",
        description: "Техника для строительных и дорожных работ",
        icon: "construction"
      },
      {
        name: "Измерительная техника",
        slug: "measuring-tools",
        description: "Точные измерительные приборы и инструменты",
        icon: "ruler-combined"
      },
      {
        name: "Компрессоры",
        slug: "compressors",
        description: "Воздушные компрессоры различной мощности",
        icon: "gauge"
      },
      {
        name: "Станки",
        slug: "machine-tools",
        description: "Промышленные станки для обработки материалов",
        icon: "cog"
      },
      {
        name: "Пушки тепловые",
        slug: "heat-guns",
        description: "Тепловые пушки для обогрева помещений",
        icon: "fire"
      },
      {
        name: "Насосы",
        slug: "pumps", 
        description: "Насосное оборудование различных типов",
        icon: "droplet"
      },
      {
        name: "Двигатели",
        slug: "engines",
        description: "Двигатели внутреннего сгорания",
        icon: "activity"
      },
      {
        name: "Пусковые устройства",
        slug: "starting-devices",
        description: "Пусковые и зарядные устройства для автомобилей",
        icon: "battery-charging"
      },
      {
        name: "Снегоуборочные машины",
        slug: "snow-removal-machines",
        description: "Техника для уборки снега",
        icon: "cloud-snow"
      },
      {
        name: "Мойки",
        slug: "washers",
        description: "Моечное оборудование высокого давления",
        icon: "droplet"
      },
      {
        name: "Мотопомпы",
        slug: "motor-pumps",
        description: "Мотопомпы для перекачивания воды",
        icon: "activity"
      },
      {
        name: "Стабилизаторы напряжения",
        slug: "voltage-stabilizers",
        description: "Стабилизаторы для защиты электрооборудования",
        icon: "zap"
      },
      {
        name: "Лазерные уровни",
        slug: "laser-levels",
        description: "Лазерные измерительные приборы",
        icon: "crosshair"
      }
    ];
    
    initialCategories.forEach(category => {
      this.createCategory(category);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id, productCount: 0 };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updateData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    // Check if category has products
    const hasProducts = Array.from(this.products.values()).some(
      (product) => product.categoryId === id
    );
    
    if (hasProducts) {
      return false;
    }
    
    return this.categories.delete(id);
  }
  
  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.slug === slug
    );
  }
  
  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId && product.isActive
    );
  }
  
  async searchProducts(params: ProductSearchParams): Promise<{ products: Product[], total: number }> {
    let filtered = Array.from(this.products.values()).filter(product => product.isActive);
    
    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    if (params.categoryId) {
      filtered = filtered.filter(product => product.categoryId === params.categoryId);
    }
    
    if (params.minPrice !== undefined) {
      filtered = filtered.filter(product => Number(product.price) >= params.minPrice!);
    }
    
    if (params.maxPrice !== undefined) {
      filtered = filtered.filter(product => Number(product.price) <= params.maxPrice!);
    }
    
    // Apply sorting
    if (params.sort) {
      switch (params.sort) {
        case 'price-low':
          filtered.sort((a, b) => Number(a.price) - Number(b.price));
          break;
        case 'price-high':
          filtered.sort((a, b) => Number(b.price) - Number(a.price));
          break;
        case 'newest':
          filtered.sort((a, b) => 
            new Date(b.createdAt || Date.now()).getTime() - 
            new Date(a.createdAt || Date.now()).getTime()
          );
          break;
        case 'popular':
          filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
          break;
        case 'featured':
        default:
          filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }
    
    const total = filtered.length;
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 12;
    const start = (page - 1) * limit;
    const end = page * limit;
    
    const paginatedProducts = filtered.slice(start, end);
    
    return {
      products: paginatedProducts,
      total
    };
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isFeatured && product.isActive
    );
  }
  
  async createProduct(productInput: ProductInput): Promise<Product> {
    const id = this.currentProductId++;
    const createdAt = new Date();
    
    // Преобразуем числовые данные в строковые для хранения
    const insertProduct: InsertProduct = {
      ...productInput,
      // Преобразуем число в строку с двумя десятичными знаками
      price: productInput.price.toString(),
      // Обрабатываем опциональную цену
      originalPrice: productInput.originalPrice ? productInput.originalPrice.toString() : null,
    };
    
    console.log("Преобразованные данные товара для хранения:", insertProduct);
    
    const product: Product = { 
      ...insertProduct, 
      id, 
      rating: 0, 
      reviewCount: 0,
      createdAt 
    };
    
    this.products.set(id, product);
    
    // Update category product count
    const category = this.categories.get(product.categoryId);
    if (category) {
      this.categories.set(category.id, {
        ...category,
        productCount: category.productCount ? category.productCount + 1 : 1
      });
    }
    
    return product;
  }
  
  async updateProduct(id: number, updateInput: Partial<ProductInput>): Promise<Product | undefined> {
    // Преобразуем числовые данные в строки для обновления
    const updateData: Partial<InsertProduct> = {
      ...updateInput,
      price: updateInput.price !== undefined ? updateInput.price.toString() : undefined,
      originalPrice: updateInput.originalPrice !== undefined 
        ? (updateInput.originalPrice === null ? null : updateInput.originalPrice.toString()) 
        : undefined,
    };
    const product = this.products.get(id);
    if (!product) return undefined;
    
    // Handle category change to update product counts
    if (updateData.categoryId && updateData.categoryId !== product.categoryId) {
      // Decrement old category count
      const oldCategory = this.categories.get(product.categoryId);
      if (oldCategory && oldCategory.productCount) {
        this.categories.set(oldCategory.id, {
          ...oldCategory,
          productCount: oldCategory.productCount - 1
        });
      }
      
      // Increment new category count
      const newCategory = this.categories.get(updateData.categoryId);
      if (newCategory) {
        this.categories.set(newCategory.id, {
          ...newCategory,
          productCount: newCategory.productCount ? newCategory.productCount + 1 : 1
        });
      }
    }
    
    const updatedProduct = { ...product, ...updateData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    // Update category product count
    const category = this.categories.get(product.categoryId);
    if (category && category.productCount) {
      this.categories.set(category.id, {
        ...category,
        productCount: category.productCount - 1
      });
    }
    
    return this.products.delete(id);
  }
  
  async bulkImportProducts(productsToImport: InsertProduct[]): Promise<{ success: number, failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const productData of productsToImport) {
      try {
        // Преобразуем InsertProduct в ProductInput
        const productInput: ProductInput = {
          ...productData,
          price: typeof productData.price === 'string' ? parseFloat(productData.price) : 0,
          originalPrice: productData.originalPrice && typeof productData.originalPrice === 'string' 
            ? parseFloat(productData.originalPrice) 
            : null,
          stock: typeof productData.stock === 'number' ? productData.stock : 0,
          categoryId: typeof productData.categoryId === 'number' ? productData.categoryId : 1,
          isActive: typeof productData.isActive === 'boolean' ? productData.isActive : true,
          isFeatured: typeof productData.isFeatured === 'boolean' ? productData.isFeatured : false,
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
    return Array.from(this.cartItems.values()).filter(
      (item) => item.cartId === cartId
    );
  }
  
  async getCartItemWithProduct(cartId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await this.getCartItems(cartId);
    return items
      .map(item => {
        const product = this.products.get(item.productId);
        if (!product) return null;
        
        return {
          ...item,
          product
        };
      })
      .filter(item => item !== null) as (CartItem & { product: Product })[];
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if product exists and is in stock
    const product = this.products.get(insertCartItem.productId);
    if (!product || !product.isActive) {
      throw new Error("Product not available");
    }
    
    // Check if this product is already in the cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.cartId === insertCartItem.cartId && item.productId === insertCartItem.productId
    );
    
    if (existingItem) {
      // Update quantity instead of adding new item
      return this.updateCartItemQuantity(
        existingItem.id, 
        existingItem.quantity + insertCartItem.quantity
      ) as Promise<CartItem>;
    }
    
    const id = this.currentCartItemId++;
    const addedAt = new Date();
    
    const cartItem: CartItem = { ...insertCartItem, id, addedAt };
    this.cartItems.set(id, cartItem);
    
    return cartItem;
  }
  
  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    // Ensure quantity is valid
    const validQuantity = Math.max(1, quantity);
    
    const updatedItem = { ...cartItem, quantity: validQuantity };
    this.cartItems.set(id, updatedItem);
    
    return updatedItem;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  async clearCart(cartId: string): Promise<boolean> {
    const cartItems = Array.from(this.cartItems.values()).filter(
      item => item.cartId === cartId
    );
    
    for (const item of cartItems) {
      this.cartItems.delete(item.id);
    }
    
    return true;
  }
  
  // Order operations
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private currentOrderId: number = 1;
  private currentOrderItemId: number = 1;
  
  async createOrder(orderInput: OrderInput, cartItems: (CartItem & { product: Product })[]): Promise<Order> {
    // Calculate total
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (Number(item.product.price) * item.quantity);
    }, 0);
    
    // Create order
    const orderId = this.currentOrderId++;
    const now = new Date();
    
    const order: Order = {
      id: orderId,
      userId: null, // Для гостевого заказа
      customerName: orderInput.customerName,
      customerEmail: orderInput.customerEmail,
      customerPhone: orderInput.customerPhone,
      address: orderInput.address,
      city: orderInput.city,
      postalCode: orderInput.postalCode,
      status: "pending",
      totalAmount: totalAmount.toString(),
      paymentMethod: orderInput.paymentMethod,
      paymentStatus: "не оплачен",
      notes: orderInput.notes,
      createdAt: now,
      updatedAt: now,
    };
    
    this.orders.set(orderId, order);
    
    // Create order items
    for (const item of cartItems) {
      const orderItemId = this.currentOrderItemId++;
      const totalPrice = Number(item.product.price) * item.quantity;
      
      const orderItem: OrderItem = {
        id: orderItemId,
        orderId,
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        totalPrice: totalPrice.toString(),
      };
      
      this.orderItems.set(orderItemId, orderItem);
    }
    
    // Очистить корзину после создания заказа
    await this.clearCart(orderInput.cartId);
    
    return order;
  }
  
  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { product?: Product })[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const items = await this.getOrderItemsWithProducts(id);
    
    return {
      ...order,
      items,
    };
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async searchOrders(params: OrderSearchParams): Promise<{ orders: Order[], total: number }> {
    let filtered = Array.from(this.orders.values());
    
    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
      );
    }
    
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(order => order.status === params.status);
    }
    
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      filtered = filtered.filter(order => 
        new Date(order.createdAt || Date.now()) >= startDate
      );
    }
    
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      filtered = filtered.filter(order => 
        new Date(order.createdAt || Date.now()) <= endDate
      );
    }
    
    // Sort by date, newest first
    filtered.sort((a, b) => 
      new Date(b.createdAt || Date.now()).getTime() - 
      new Date(a.createdAt || Date.now()).getTime()
    );
    
    const total = filtered.length;
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const start = (page - 1) * limit;
    const end = page * limit;
    
    const paginatedOrders = filtered.slice(start, end);
    
    return {
      orders: paginatedOrders,
      total
    };
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      status,
      updatedAt: new Date(),
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      item => item.orderId === orderId
    );
  }
  
  async getOrderItemsWithProducts(orderId: number): Promise<(OrderItem & { product?: Product })[]> {
    const items = await this.getOrderItems(orderId);
    
    return items.map(item => {
      const product = this.products.get(item.productId);
      return {
        ...item,
        product,
      };
    });
  }
}

export const storage = new MemStorage();
