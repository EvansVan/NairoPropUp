import { type User, type InsertUser, type Product, type InsertProduct, type MeetingRequest, type InsertMeetingRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  createMeetingRequest(request: InsertMeetingRequest): Promise<MeetingRequest>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private meetingRequests: Map<string, MeetingRequest>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.meetingRequests = new Map();

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
}

export const storage = new MemStorage();
