import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
});

export const meetingRequests = pgTable("meeting_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
});

// Cart & Order tables for Phase 2
export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  cartToken: varchar("cart_token").unique(), // For guest carts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").references(() => carts.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceSnapshot: decimal("unit_price_snapshot", { precision: 10, scale: 2 }).notNull(), // Price at time of adding
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").unique().notNull(), // Human-readable order number
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Nullable for guest orders
  status: varchar("status").notNull().default("PENDING"), // PENDING, UNPAID, PAID, FULFILLED, SHIPPED, CANCELLED, REFUNDED
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountTotal: decimal("discount_total", { precision: 10, scale: 2 }).default("0").notNull(),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }).default("0").notNull(),
  shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("KES"),
  paymentStatus: varchar("payment_status").notNull().default("PENDING"), // PENDING, REQUIRES_ACTION, PAID, FAILED, REFUNDED
  paymentProvider: varchar("payment_provider"), // STRIPE, MPESA
  shippingAddress: text("shipping_address"), // JSON string for guest orders
  customerEmail: text("customer_email"), // For guest orders
  customerName: text("customer_name"), // For guest orders
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }).notNull(),
  nameSnapshot: text("name_snapshot").notNull(), // Product name at time of order
  priceSnapshot: decimal("price_snapshot", { precision: 10, scale: 2 }).notNull(), // Price at time of order
  quantity: integer("quantity").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Payment table for Phase 3
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider").notNull(), // STRIPE, MPESA
  providerPaymentId: varchar("provider_payment_id"), // Stripe payment_intent_id or M-Pesa CheckoutRequestID
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("KES"),
  status: varchar("status").notNull().default("PENDING"), // PENDING, SUCCESS, FAILED, REFUNDED
  rawResponse: text("raw_response"), // JSON string of provider response
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const cartsRelation = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelation = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelation = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelation = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelation = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertMeetingRequestSchema = createInsertSchema(meetingRequests).omit({
  id: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type MeetingRequest = typeof meetingRequests.$inferSelect;
export type InsertMeetingRequest = z.infer<typeof insertMeetingRequestSchema>;

// Cart & Order types
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  items: z.array(createInsertSchema(orderItems).omit({ id: true, orderId: true })),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
