import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Use DATABASE_URL from environment, fallback to in-memory if not set
const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    if (databaseUrl) {
      const sql = neon(databaseUrl);
      db = drizzle(sql, { schema });
    } else {
      // In development without DATABASE_URL, return null to use MemStorage
      return null;
    }
  }
  return db;
}

export function hasDatabase() {
  return !!databaseUrl;
}
