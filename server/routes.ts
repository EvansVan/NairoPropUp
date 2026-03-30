import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertMeetingRequestSchema, insertOrderSchema } from "@shared/schema";
import { sendMeetingConfirmation } from "./email";
import { z } from "zod";
import { getPaymentProvider } from "./lib/payment";
import { hashPassword, verifyPassword } from "./lib/auth";
import { slugify } from "./lib/slug";

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth: register
  app.post("/api/register", async (req, res) => {
    try {
      const data = z.object({ username: z.string().min(3), password: z.string().min(6) }).parse(req.body);

      const existing = await storage.getUserByUsername(data.username);
      if (existing) return res.status(409).json({ message: "Username already taken" });

      const hashed = hashPassword(data.password);
      const user = await storage.createUser({ username: data.username, password: hashed });

      // create session
      (req as any).session.userId = user.id;

      const { password, ...safe } = user as any;
      res.status(201).json(safe);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Auth: login
  app.post("/api/login", async (req, res) => {
    try {
      const data = z.object({ username: z.string(), password: z.string() }).parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const ok = verifyPassword(data.password, (user as any).password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      (req as any).session.userId = user.id;
      const { password, ...safe } = user as any;
      res.json(safe);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth: profile
  app.get("/api/profile", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // Auth: update profile
  app.patch("/api/profile", async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId as string | undefined;
      if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });

      const data = z.object({
        username: z.string().min(3).optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6).optional(),
      }).parse(req.body);

      const existingUser = await storage.getUser(sessionUserId);
      if (!existingUser) return res.status(404).json({ message: "User not found" });

      const updates: Partial<{ username: string; password: string }> = {};

      if (data.username && data.username !== existingUser.username) {
        const taken = await storage.getUserByUsername(data.username);
        if (taken && taken.id !== existingUser.id) {
          return res.status(409).json({ message: "Username already taken" });
        }
        updates.username = data.username;
      }

      if (data.newPassword) {
        if (!data.currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
        const ok = verifyPassword(data.currentPassword, existingUser.password);
        if (!ok) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
        updates.password = hashPassword(data.newPassword);
      }

      if (!updates.username && !updates.password) {
        const { password, ...safeExisting } = existingUser;
        return res.json(safeExisting);
      }

      const updated = await storage.updateUser(existingUser.id, updates);
      if (!updated) return res.status(500).json({ message: "Failed to update profile" });

      const { password, ...safe } = updated;
      res.json(safe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Auth: logout
  app.post("/api/logout", (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.json({ message: "Logged out" });
      });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });


  app.get("/api/products", async (req, res) => {
    try {
      const categoryParam = typeof req.query.category === "string" ? req.query.category : undefined;
      const searchParam = typeof req.query.q === "string" ? req.query.q :
        (typeof req.query.search === "string" ? req.query.search : undefined);
      const tagsParam = typeof req.query.tags === "string" ? req.query.tags : undefined;
      const singleTagParam = typeof req.query.tag === "string" ? req.query.tag : undefined;

      const tagList = [
        ...(tagsParam ? tagsParam.split(",") : []),
        ...(singleTagParam ? [singleTagParam] : []),
      ]
        .map((tag) => slugify(tag))
        .filter((tag) => tag.length > 0);

      const filters = {
        categorySlug: categoryParam ? slugify(categoryParam) : undefined,
        tags: tagList.length ? Array.from(new Set(tagList)) : undefined,
        search: searchParam?.trim().length ? searchParam.trim() : undefined,
      } as const;

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/catalog/facets", async (_req, res) => {
    try {
      const catalog = await storage.getProducts();

      const categoryMap = new Map<string, { name: string; slug: string; count: number }>();
      const tagMap = new Map<string, { value: string; count: number }>();

      catalog.forEach((product) => {
        const categoryKey = product.categorySlug;
        if (!categoryMap.has(categoryKey)) {
          categoryMap.set(categoryKey, {
            name: product.category,
            slug: product.categorySlug,
            count: 0,
          });
        }
        categoryMap.get(categoryKey)!.count += 1;

        product.tags.forEach((tag) => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, { value: tag, count: 0 });
          }
          tagMap.get(tag)!.count += 1;
        });
      });

      res.json({
        categories: Array.from(categoryMap.values()).sort((a, b) => b.count - a.count),
        tags: Array.from(tagMap.values()).sort((a, b) => b.count - a.count),
      });
    } catch (error) {
      console.error("Failed to build catalog facets", error);
      res.status(500).json({ message: "Failed to build catalog facets" });
    }
  });

  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const normalizedSlug = slugify(req.params.slug);
      const product = await storage.getProductBySlug(normalizedSlug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const normalizedPayload = {
        ...req.body,
        slug: req.body?.slug ?? slugify(req.body?.name ?? ""),
        categorySlug: req.body?.categorySlug ?? slugify(req.body?.category ?? ""),
        tags: Array.isArray(req.body?.tags)
          ? req.body.tags.map((tag: string) => slugify(tag))
          : req.body?.tags,
      };
      const validatedData = insertProductSchema.parse(normalizedPayload);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.post("/api/meeting-requests", async (req, res) => {
    try {
      const validatedData = insertMeetingRequestSchema.parse(req.body);
      const request = await storage.createMeetingRequest(validatedData);

      // Send confirmation email with calendar invite
      try {
        await sendMeetingConfirmation(
          validatedData.email,
          validatedData.name,
          validatedData.appointmentDate,
          validatedData.appointmentTime
        );
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the request if email fails - still store the meeting request
      }

      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid meeting request data" });
    }
  });

  // Cart routes (Phase 2)
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = (req as any).user?.id; // TODO: implement auth middleware
      const cartToken = req.headers["x-cart-token"] as string | undefined;

      const cart = await storage.getOrCreateCart(userId, cartToken);
      const cartWithItems = await storage.getCartWithItems(cart.id);

      if (!cartWithItems) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Return cartToken for guest carts so client can store it
      res.json({
        ...cartWithItems,
        cartToken: cart.cartToken,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart" });
    }
  });

  app.post("/api/cart/items", async (req, res) => {
    try {
      const { productId, quantity } = z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }).parse(req.body);

      const userId = (req as any).user?.id;
      const cartToken = req.headers["x-cart-token"] as string | undefined;

      const cart = await storage.getOrCreateCart(userId, cartToken);
      await storage.addCartItem(cart.id, productId, quantity);

      const cartWithItems = await storage.getCartWithItems(cart.id);
      if (!cartWithItems) {
        return res.status(404).json({ message: "Cart not found" });
      }

      res.json({
        ...cartWithItems,
        cartToken: cart.cartToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = z.object({
        quantity: z.number().int().min(0),
      }).parse(req.body);

      const updatedItem = await storage.updateCartItem(itemId, quantity);

      if (!updatedItem && quantity === 0) {
        return res.json({ message: "Item removed" });
      }

      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      await storage.removeCartItem(itemId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.post("/api/cart/merge", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const cartToken = req.headers["x-cart-token"] as string | undefined;

      if (!userId || !cartToken) {
        return res.status(400).json({ message: "Missing userId or cartToken" });
      }

      const mergedCart = await storage.mergeGuestCartToUser(userId, cartToken);
      res.json({
        ...mergedCart,
        cartToken: null, // Guest token is no longer valid
      });
    } catch (error) {
      console.error("Cart merge error:", error);
      res.status(500).json({ message: "Failed to merge cart" });
    }
  });

  // Order/Checkout routes (Phase 2)
  app.post("/api/checkout", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const cartToken = req.headers["x-cart-token"] as string | undefined;

      // Get cart with items
      const cart = await storage.getOrCreateCart(userId, cartToken);
      const cartWithItems = await storage.getCartWithItems(cart.id);

      if (!cartWithItems || cartWithItems.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate totals
      const subtotal = cartWithItems.items.reduce(
        (sum, item) => sum + parseFloat(item.unitPriceSnapshot) * item.quantity,
        0
      );
      const shippingFee = 10.0; // Fixed shipping for now
      const taxTotal = subtotal * 0.1; // 10% tax
      const total = subtotal + shippingFee + taxTotal;

      // Validate checkout data
      const checkoutData = z.object({
        shippingAddress: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerName: z.string().optional(),
      }).parse(req.body);

      // Create order
      const orderData = {
        userId: userId || null,
        status: "PENDING",
        subtotal: subtotal.toString(),
        discountTotal: "0",
        taxTotal: taxTotal.toString(),
        shippingFee: shippingFee.toString(),
        total: total.toString(),
        currency: "KES",
        paymentStatus: "PENDING",
        paymentProvider: null,
        shippingAddress: checkoutData.shippingAddress || null,
        customerEmail: checkoutData.customerEmail || null,
        customerName: checkoutData.customerName || null,
        items: cartWithItems.items.map((item) => ({
          productId: item.productId,
          nameSnapshot: item.product.name,
          priceSnapshot: item.unitPriceSnapshot,
          quantity: item.quantity,
          total: (parseFloat(item.unitPriceSnapshot) * item.quantity).toString(),
        })),
      };

      const order = await storage.createOrder(orderData);

      // Clear cart after successful order creation
      await storage.clearCart(cart.id);

      // Get full order with items
      const fullOrder = await storage.getOrder(order.id);
      if (!fullOrder) {
        return res.status(500).json({ message: "Failed to retrieve order" });
      }

      res.status(201).json(fullOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid checkout data", errors: error.errors });
      }
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userOrders = await storage.getUserOrders(userId);
      res.json(userOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Payment routes (Phase 3)
  app.post("/api/payments/initiate", async (req, res) => {
    try {
      const { orderId, provider, options } = z.object({
        orderId: z.string(),
        provider: z.enum(["STRIPE", "MPESA"]),
        options: z.record(z.any()).optional(),
      }).parse(req.body);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.paymentStatus === "PAID") {
        return res.status(400).json({ message: "Order already paid" });
      }

      // Get payment provider
      const paymentProvider = getPaymentProvider(provider);

      // Initiate payment
      const paymentResult = await paymentProvider.initiatePayment(order, options || {});

      // Create payment record
      const payment = await storage.createPayment({
        orderId: order.id,
        provider: paymentResult.provider,
        providerPaymentId: paymentResult.providerPaymentId,
        amount: order.total,
        currency: order.currency,
        status: "PENDING",
        rawResponse: JSON.stringify(paymentResult),
      });

      // Update order with payment provider
      await storage.updateOrderPaymentStatus(order.id, "REQUIRES_ACTION", provider);

      res.json({
        paymentId: payment.id,
        ...paymentResult,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Payment initiation error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to initiate payment" });
    }
  });

  // Webhook routes
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const paymentProvider = getPaymentProvider("STRIPE");
      const result = await paymentProvider.handleWebhook(req.body, req.headers as Record<string, string>);

      if (result.success && result.orderId && result.paymentId) {
        // Find payment by provider payment ID
        const payment = await storage.getPaymentByProviderId("STRIPE", result.paymentId);
        if (payment) {
          await storage.updatePaymentStatus(payment.id, "SUCCESS", req.body);
          await storage.updateOrderPaymentStatus(payment.orderId, "PAID", "STRIPE");
          await storage.updateOrderStatus(payment.orderId, "PAID");
        }
      } else if (!result.success && result.orderId && result.paymentId) {
        const payment = await storage.getPaymentByProviderId("STRIPE", result.paymentId);
        if (payment) {
          await storage.updatePaymentStatus(payment.id, "FAILED", req.body);
          await storage.updateOrderPaymentStatus(payment.orderId, "FAILED", "STRIPE");
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/mpesa", async (req, res) => {
    try {
      const paymentProvider = getPaymentProvider("MPESA");
      const result = await paymentProvider.handleWebhook(req.body, req.headers as Record<string, string>);

      if (result.success && result.paymentId) {
        // Find payment by CheckoutRequestID
        const payment = await storage.getPaymentByProviderId("MPESA", result.paymentId);
        if (payment) {
          await storage.updatePaymentStatus(payment.id, "SUCCESS", req.body);
          await storage.updateOrderPaymentStatus(payment.orderId, "PAID", "MPESA");
          await storage.updateOrderStatus(payment.orderId, "PAID");
        }
      } else if (!result.success && result.paymentId) {
        const payment = await storage.getPaymentByProviderId("MPESA", result.paymentId);
        if (payment) {
          await storage.updatePaymentStatus(payment.id, "FAILED", req.body);
          await storage.updateOrderPaymentStatus(payment.orderId, "FAILED", "MPESA");
        }
      }

      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error) {
      console.error("M-Pesa webhook error:", error);
      res.status(400).json({ ResultCode: 1, ResultDesc: "Failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
