import { type JobScrapingRequest, type InsertJobScrapingRequest, jobScrapingRequests } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getJobScrapingRequest(id: string): Promise<JobScrapingRequest | undefined>;
  createJobScrapingRequest(request: InsertJobScrapingRequest): Promise<JobScrapingRequest>;
  updateJobScrapingRequest(id: string, updates: Partial<JobScrapingRequest>): Promise<JobScrapingRequest | undefined>;
  getJobScrapingRequestsByStatus(status: string): Promise<JobScrapingRequest[]>;
  cancelJobScrapingRequest(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getJobScrapingRequest(id: string): Promise<JobScrapingRequest | undefined> {
    const [request] = await db.select().from(jobScrapingRequests).where(eq(jobScrapingRequests.id, id));
    return request || undefined;
  }

  async createJobScrapingRequest(insertRequest: InsertJobScrapingRequest): Promise<JobScrapingRequest> {
    const [request] = await db
      .insert(jobScrapingRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updateJobScrapingRequest(id: string, updates: Partial<JobScrapingRequest>): Promise<JobScrapingRequest | undefined> {
    const [updated] = await db
      .update(jobScrapingRequests)
      .set(updates)
      .where(eq(jobScrapingRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async getJobScrapingRequestsByStatus(status: string): Promise<JobScrapingRequest[]> {
    return await db.select().from(jobScrapingRequests).where(eq(jobScrapingRequests.status, status));
  }

  async cancelJobScrapingRequest(id: string): Promise<void> {
    await db
      .update(jobScrapingRequests)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(eq(jobScrapingRequests.id, id));
  }
}

export const storage = new DatabaseStorage();
