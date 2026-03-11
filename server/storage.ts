import {
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type MeetingRequest,
  type InsertMeetingRequest,
  type Cart,
  type CartItem,
  type Order,
  type OrderItem,
  type InsertCartItem,
  type InsertOrder,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { carts, cartItems, orders, orderItems, products, users, meetingRequests, payments } from "@shared/schema";
import { getDb, hasDatabase } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, "username" | "password">>): Promise<User | undefined>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  createMeetingRequest(request: InsertMeetingRequest): Promise<MeetingRequest>;

  // Cart methods
  getOrCreateCart(userId?: string, cartToken?: string): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | undefined>;
  getCartWithItems(cartId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined>;
  addCartItem(cartId: string, productId: string, quantity: number): Promise<CartItem>;
  updateCartItem(itemId: string, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;

  // Order methods
  createOrder(orderData: InsertOrder): Promise<Order>;
  getOrder(orderId: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentProvider?: string): Promise<Order | undefined>;

  // Payment methods
  createPayment(paymentData: InsertPayment): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | undefined>;
  getPaymentByProviderId(provider: string, providerPaymentId: string): Promise<Payment | undefined>;
  getOrderPayments(orderId: string): Promise<Payment[]>;
  updatePaymentStatus(paymentId: string, status: string, rawResponse?: any): Promise<Payment | undefined>;
}

// DbStorage implementation using Drizzle ORM
export class DbStorage implements IStorage {
  private db = getDb()!;

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<Pick<User, "username" | "password">>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getProducts(): Promise<Product[]> {
    return this.db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async createMeetingRequest(insertRequest: InsertMeetingRequest): Promise<MeetingRequest> {
    const result = await this.db.insert(meetingRequests).values(insertRequest).returning();
    return result[0];
  }

  // Cart methods
  async getOrCreateCart(userId?: string, cartToken?: string): Promise<Cart> {
    if (userId) {
      const existing = await this.db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      if (existing[0]) return existing[0];
      const result = await this.db.insert(carts).values({ userId }).returning();
      return result[0];
    }

    if (cartToken) {
      const existing = await this.db.select().from(carts).where(eq(carts.cartToken, cartToken)).limit(1);
      if (existing[0]) return existing[0];
    }

    const newToken = cartToken || randomUUID();
    const result = await this.db.insert(carts).values({ cartToken: newToken }).returning();
    return result[0];
  }

  async getCart(cartId: string): Promise<Cart | undefined> {
    const result = await this.db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    return result[0];
  }

  async getCartWithItems(cartId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined> {
    const cart = await this.getCart(cartId);
    if (!cart) return undefined;

    const items = await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        return { ...item, product };
      })
    );

    return { ...cart, items: itemsWithProducts };
  }

  async addCartItem(cartId: string, productId: string, quantity: number): Promise<CartItem> {
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Product not found");

    const existing = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
      .limit(1);

    if (existing[0]) {
      const newQuantity = existing[0].quantity + quantity;
      const result = await this.db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await this.db
      .insert(cartItems)
      .values({
        cartId,
        productId,
        quantity,
        unitPriceSnapshot: product.price,
      })
      .returning();
    return result[0];
  }

  async updateCartItem(itemId: string, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeCartItem(itemId);
      return undefined;
    }
    const result = await this.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId))
      .returning();
    return result[0];
  }

  async removeCartItem(itemId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.id, itemId));
  }

  async clearCart(cartId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Order methods
  async createOrder(orderData: InsertOrder): Promise<Order> {
    // Generate order number: ORD-YYYYMMDD-XXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const { items, ...orderFields } = orderData;

    const [order] = await this.db
      .insert(orders)
      .values({ ...orderFields, orderNumber })
      .returning();

    if (items.length > 0) {
      await this.db.insert(orderItems).values(
        items.map((item) => ({
          ...item,
          orderId: order.id,
        }))
      );
    }

    return order;
  }

  async getOrder(orderId: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order[0]) return undefined;

    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return { ...order[0], items };
  }

  async getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = await this.db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (!order[0]) return undefined;

    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, order[0].id));
    return { ...order[0], items };
  }

  async getUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
    const userOrders = await this.db.select().from(orders).where(eq(orders.userId, userId));

    return Promise.all(
      userOrders.map(async (order) => {
        const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const result = await this.db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentProvider?: string): Promise<Order | undefined> {
    const updateData: any = { paymentStatus, updatedAt: new Date() };
    if (paymentProvider) {
      updateData.paymentProvider = paymentProvider;
    }
    const result = await this.db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }

  // Payment methods
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(paymentData).returning();
    return result[0];
  }

  async getPayment(paymentId: string): Promise<Payment | undefined> {
    const result = await this.db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    return result[0];
  }

  async getPaymentByProviderId(provider: string, providerPaymentId: string): Promise<Payment | undefined> {
    const result = await this.db
      .select()
      .from(payments)
      .where(and(eq(payments.provider, provider), eq(payments.providerPaymentId, providerPaymentId)))
      .limit(1);
    return result[0];
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return this.db.select().from(payments).where(eq(payments.orderId, orderId));
  }

  async updatePaymentStatus(paymentId: string, status: string, rawResponse?: any): Promise<Payment | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (rawResponse) {
      updateData.rawResponse = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse);
    }
    const result = await this.db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentId))
      .returning();
    return result[0];
  }
}

// Extend MemStorage with cart and order methods
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private meetingRequests: Map<string, MeetingRequest>;
  private carts: Map<string, Cart>;
  private cartItems: Map<string, CartItem>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private payments: Map<string, Payment>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.meetingRequests = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();

    // Seed initial demo products so the shop has real data in Phase 1
    const seedProducts: Omit<Product, "id">[] = [
      {
        name: "Cyberpunk Helmet Prop",
        description:
          "High-quality 3D printed helmet with LED integration and weathering effects",
        price: "149.99",
        imageUrl:
          "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&h=500&fit=crop",
        category: "Props",
      },
      {
        name: "Fantasy Sword Replica",
        description:
          "Detailed replica with metallic finish and leather-wrapped handle",
        price: "89.99",
        imageUrl:
          "https://images.unsplash.com/photo-1609840114035-3c981c7fec2d?w=500&h=500&fit=crop",
        category: "Weapons",
      },
      {
        name: "Sci-Fi Gauntlet",
        description:
          "Articulated armor piece with LED accents and premium paint job",
        price: "199.99",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
        category: "Armor",
      },
      {
        name: "Dragon Figurine",
        description:
          "Hand-painted miniature with intricate scale details and custom base",
        price: "45.99",
        imageUrl:
          "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=500&h=500&fit=crop",
        category: "Miniatures",
      },
      {
        name: "Steampunk Goggles",
        description:
          "Vintage-style goggles with brass detailing and adjustable straps",
        price: "64.99",
        imageUrl:
          "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=500&h=500&fit=crop",
        category: "Accessories",
      },
      {
        name: "Wizard Staff Prop",
        description:
          "6-foot tall staff with LED crystal orb and detailed carvings",
        price: "179.99",
        imageUrl:
          "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=500&h=500&fit=crop",
        category: "Props",
      },
      {
        name: "Space Marine Shoulder Pad",
        description:
          "Wearable armor piece with battle damage and custom insignia",
        price: "79.99",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
        category: "Armor",
      },
      {
        name: "Medieval Shield",
        description:
          "Detailed replica with family crest and authentic weathering",
        price: "129.99",
        imageUrl:
          "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=500&h=500&fit=crop",
        category: "Props",
      },
    ];

    for (const seed of seedProducts) {
      const id = randomUUID();
      const product: Product = { ...seed, id };
      this.products.set(id, product);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<Pick<User, "username" | "password">>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: User = {
      ...existing,
      ...data,
    };
    this.users.set(id, updated);
    return updated;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async createMeetingRequest(insertRequest: InsertMeetingRequest): Promise<MeetingRequest> {
    const id = randomUUID();
    const request: MeetingRequest = { ...insertRequest, id };
    this.meetingRequests.set(id, request);
    return request;
  }

  // Cart methods
  async getOrCreateCart(userId?: string, cartToken?: string): Promise<Cart> {
    if (userId) {
      const existing = Array.from(this.carts.values()).find((c) => c.userId === userId);
      if (existing) return existing;
      const id = randomUUID();
      const cart: Cart = {
        id,
        userId,
        cartToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carts.set(id, cart);
      return cart;
    }

    if (cartToken) {
      const existing = Array.from(this.carts.values()).find((c) => c.cartToken === cartToken);
      if (existing) return existing;
    }

    const id = randomUUID();
    const token = cartToken || randomUUID();
    const cart: Cart = {
      id,
      userId: null,
      cartToken: token,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.carts.set(id, cart);
    return cart;
  }

  async getCart(cartId: string): Promise<Cart | undefined> {
    return this.carts.get(cartId);
  }

  async getCartWithItems(cartId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined> {
    const cart = this.carts.get(cartId);
    if (!cart) return undefined;

    const items = Array.from(this.cartItems.values()).filter((item) => item.cartId === cartId);
    const itemsWithProducts = items.map((item) => {
      const product = this.products.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      return { ...item, product };
    });

    return { ...cart, items: itemsWithProducts };
  }

  async addCartItem(cartId: string, productId: string, quantity: number): Promise<CartItem> {
    const product = this.products.get(productId);
    if (!product) throw new Error("Product not found");

    const existing = Array.from(this.cartItems.values()).find(
      (item) => item.cartId === cartId && item.productId === productId
    );

    if (existing) {
      existing.quantity += quantity;
      this.cartItems.set(existing.id, existing);
      return existing;
    }

    const id = randomUUID();
    const item: CartItem = {
      id,
      cartId,
      productId,
      quantity,
      unitPriceSnapshot: product.price,
      createdAt: new Date(),
    };
    this.cartItems.set(id, item);
    return item;
  }

  async updateCartItem(itemId: string, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeCartItem(itemId);
      return undefined;
    }
    const item = this.cartItems.get(itemId);
    if (!item) return undefined;
    item.quantity = quantity;
    this.cartItems.set(itemId, item);
    return item;
  }

  async removeCartItem(itemId: string): Promise<void> {
    this.cartItems.delete(itemId);
  }

  async clearCart(cartId: string): Promise<void> {
    const itemsToDelete = Array.from(this.cartItems.values())
      .filter((item) => item.cartId === cartId)
      .map((item) => item.id);
    itemsToDelete.forEach((id) => this.cartItems.delete(id));
  }

  // Order methods
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const { items, ...orderFields } = orderData;

    const orderId = randomUUID();
    const order: Order = {
      id: orderId,
      orderNumber,
      userId: orderFields.userId ?? null,
      status: orderFields.status ?? "PENDING",
      subtotal: orderFields.subtotal,
      discountTotal: orderFields.discountTotal ?? "0",
      taxTotal: orderFields.taxTotal ?? "0",
      shippingFee: orderFields.shippingFee ?? "0",
      total: orderFields.total,
      currency: orderFields.currency ?? "KES",
      paymentStatus: orderFields.paymentStatus ?? "PENDING",
      paymentProvider: orderFields.paymentProvider ?? null,
      shippingAddress: orderFields.shippingAddress ?? null,
      customerEmail: orderFields.customerEmail ?? null,
      customerName: orderFields.customerName ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(orderId, order);

    items.forEach((itemData) => {
      const itemId = randomUUID();
      const item: OrderItem = {
        id: itemId,
        orderId,
        ...itemData,
      };
      this.orderItems.set(itemId, item);
    });

    return order;
  }

  async getOrder(orderId: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    const items = Array.from(this.orderItems.values()).filter((item) => item.orderId === orderId);
    return { ...order, items };
  }

  async getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = Array.from(this.orders.values()).find((o) => o.orderNumber === orderNumber);
    if (!order) return undefined;

    const items = Array.from(this.orderItems.values()).filter((item) => item.orderId === order.id);
    return { ...order, items };
  }

  async getUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
    const userOrders = Array.from(this.orders.values()).filter((o) => o.userId === userId);
    return userOrders.map((order) => {
      const items = Array.from(this.orderItems.values()).filter((item) => item.orderId === order.id);
      return { ...order, items };
    });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    order.status = status;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
    return order;
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentProvider?: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    order.paymentStatus = paymentStatus;
    if (paymentProvider) {
      order.paymentProvider = paymentProvider;
    }
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
    return order;
  }

  // Payment methods
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      id,
      orderId: paymentData.orderId,
      provider: paymentData.provider,
      providerPaymentId: paymentData.providerPaymentId ?? null,
      amount: paymentData.amount,
      currency: paymentData.currency ?? "KES",
      status: paymentData.status ?? "PENDING",
      rawResponse: paymentData.rawResponse ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(paymentId: string): Promise<Payment | undefined> {
    return this.payments.get(paymentId);
  }

  async getPaymentByProviderId(provider: string, providerPaymentId: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      (p) => p.provider === provider && p.providerPaymentId === providerPaymentId
    );
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((p) => p.orderId === orderId);
  }

  async updatePaymentStatus(paymentId: string, status: string, rawResponse?: any): Promise<Payment | undefined> {
    const payment = this.payments.get(paymentId);
    if (!payment) return undefined;
    payment.status = status;
    if (rawResponse) {
      payment.rawResponse = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse);
    }
    payment.updatedAt = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }
}

// Use DbStorage if DATABASE_URL is set, otherwise use MemStorage
export const storage: IStorage = hasDatabase() ? new DbStorage() : new MemStorage();
