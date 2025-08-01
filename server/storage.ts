import { 
  type JobScrapingRequest, 
  type InsertJobScrapingRequest, 
  type User,
  type UpsertUser,
  jobScrapingRequests,
  users 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Job scraping methods
  getJobScrapingRequest(id: string): Promise<JobScrapingRequest | undefined>;
  createJobScrapingRequest(request: InsertJobScrapingRequest & { userId: string }): Promise<JobScrapingRequest>;
  updateJobScrapingRequest(id: string, updates: Partial<JobScrapingRequest>): Promise<JobScrapingRequest | undefined>;
  getJobScrapingRequestsByStatus(status: string): Promise<JobScrapingRequest[]>;
  getJobScrapingRequestsByUser(userId: string): Promise<JobScrapingRequest[]>;
  cancelJobScrapingRequest(id: string): Promise<void>;
  
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<{
    totalJobsScraped: number;
    totalApplicationsSent: number;
    recentSearches: JobScrapingRequest[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getJobScrapingRequest(id: string): Promise<JobScrapingRequest | undefined> {
    const [request] = await db.select().from(jobScrapingRequests).where(eq(jobScrapingRequests.id, id));
    return request || undefined;
  }

  async createJobScrapingRequest(insertRequest: InsertJobScrapingRequest & { userId: string }): Promise<JobScrapingRequest> {
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

  async getJobScrapingRequestsByUser(userId: string): Promise<JobScrapingRequest[]> {
    return await db.select().from(jobScrapingRequests).where(eq(jobScrapingRequests.userId, userId));
  }

  async cancelJobScrapingRequest(id: string): Promise<void> {
    await db
      .update(jobScrapingRequests)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(eq(jobScrapingRequests.id, id));
  }

  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getDashboardStats(userId: string): Promise<{
    totalJobsScraped: number;
    totalApplicationsSent: number;
    recentSearches: JobScrapingRequest[];
  }> {
    // Get recent searches
    const recentSearches = await db
      .select()
      .from(jobScrapingRequests)
      .where(eq(jobScrapingRequests.userId, userId))
      .orderBy(desc(jobScrapingRequests.createdAt))
      .limit(10);

    // Calculate total jobs scraped
    let totalJobsScraped = 0;
    let totalApplicationsSent = 0;

    for (const search of recentSearches) {
      if (search.status === 'completed' && search.enrichedResults) {
        const results = search.enrichedResults as any;
        totalJobsScraped += results.totalCount || 0;
        totalApplicationsSent += results.canApplyCount || 0;
      }
    }

    // Update user stats
    await db
      .update(users)
      .set({
        totalJobsScraped,
        totalApplicationsSent,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return {
      totalJobsScraped,
      totalApplicationsSent,
      recentSearches
    };
  }
}

export const storage = new DatabaseStorage();
