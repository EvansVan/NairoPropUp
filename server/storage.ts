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
