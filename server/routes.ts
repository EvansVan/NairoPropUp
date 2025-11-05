import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertMeetingRequestSchema } from "@shared/schema";
import { sendMeetingConfirmation } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
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
      const validatedData = insertProductSchema.parse(req.body);
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

  const httpServer = createServer(app);

  return httpServer;
}
