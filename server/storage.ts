import { 
  type JobScrapingRequest, 
  type InsertJobScrapingRequest, 
  type User,
  type UpsertUser,
  type EmailApplication,
  type InsertEmailApplication,
  type GmailCredentials,
  type InsertGmailCredentials,
  jobScrapingRequests,
  users,
  emailApplications,
  gmailCredentials
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";
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
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Resume operations
  updateUserResume(userId: string, resumeText: string, fileName: string): Promise<User | undefined>;
  getUserResume(userId: string): Promise<{ resumeText: string | null; resumeFileName: string | null; resumeUploadedAt: Date | null } | undefined>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<{
    totalJobsScraped: number;
    totalApplicationsSent: number;
    recentSearches: JobScrapingRequest[];
  }>;
  
  // Email application methods
  createEmailApplication(application: InsertEmailApplication): Promise<EmailApplication>;
  getEmailApplicationsByUser(userId: string): Promise<EmailApplication[]>;
  
  // Gmail credentials methods
  getGmailCredentials(userId: string): Promise<GmailCredentials | undefined>;
  upsertGmailCredentials(credentials: InsertGmailCredentials): Promise<GmailCredentials>;
  deleteGmailCredentials(userId: string): Promise<void>;
  unlinkGmailCredentials(userId: string): Promise<void>;
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
    // First check if user exists by email to get their existing ID
    const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
    
    if (existingUser) {
      // Update existing user, keeping their original ID
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserResume(userId: string, resumeText: string, fileName: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        resumeText,
        resumeFileName: fileName,
        resumeUploadedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async getUserResume(userId: string): Promise<{ resumeText: string | null; resumeFileName: string | null; resumeUploadedAt: Date | null } | undefined> {
    const [user] = await db
      .select({
        resumeText: users.resumeText,
        resumeFileName: users.resumeFileName,
        resumeUploadedAt: users.resumeUploadedAt
      })
      .from(users)
      .where(eq(users.id, userId));
    return user || undefined;
  }

  async getDashboardStats(userId: string): Promise<{
    totalJobsScraped: number;
    totalApplicationsSent: number;
    recentSearches: JobScrapingRequest[];
  }> {
    // Get ALL searches to calculate cumulative total
    const allSearches = await db
      .select()
      .from(jobScrapingRequests)
      .where(eq(jobScrapingRequests.userId, userId))
      .orderBy(desc(jobScrapingRequests.createdAt));
    
    // Get recent searches for display (limit to 10)
    const recentSearches = allSearches.slice(0, 10);
    
    // Calculate cumulative total of all fake jobs from all searches
    let totalJobsScraped = 0;
    for (const search of allSearches) {
      if (search.status === 'completed' && search.enrichedResults) {
        const enrichedResults = search.enrichedResults as any;
        // Use stored fake total if available, otherwise use a consistent fallback based on search ID
        if (enrichedResults.fakeTotalJobs) {
          totalJobsScraped += enrichedResults.fakeTotalJobs;
        } else {
          // For old searches without fakeTotalJobs, generate consistent number based on search ID
          let hash = 0;
          for (let i = 0; i < search.id.length; i++) {
            hash = ((hash << 5) - hash) + search.id.charCodeAt(i);
            hash = hash & hash;
          }
          const consistentFakeTotal = 500 + Math.abs(hash % 1501); // 500-2000
          totalJobsScraped += consistentFakeTotal;
        }
      }
    }
    
    // Get actual count of emails sent from emailApplications table
    const emailApplicationsResult = await db
      .select({ count: count() })
      .from(emailApplications)
      .where(eq(emailApplications.userId, userId));
    
    const totalApplicationsSent = emailApplicationsResult[0]?.count || 0;

    return {
      totalJobsScraped,
      totalApplicationsSent,
      recentSearches
    };
  }
  
  async createEmailApplication(application: InsertEmailApplication): Promise<EmailApplication> {
    const [created] = await db.insert(emailApplications).values(application).returning();
    return created;
  }
  
  async getEmailApplicationsByUser(userId: string): Promise<EmailApplication[]> {
    return await db
      .select()
      .from(emailApplications)
      .where(eq(emailApplications.userId, userId))
      .orderBy(desc(emailApplications.sentAt));
  }
  
  async getGmailCredentials(userId: string): Promise<GmailCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(gmailCredentials)
      .where(eq(gmailCredentials.userId, userId));
    return credentials || undefined;
  }
  
  async upsertGmailCredentials(credentials: InsertGmailCredentials): Promise<GmailCredentials> {
    const [upserted] = await db
      .insert(gmailCredentials)
      .values(credentials)
      .onConflictDoUpdate({
        target: gmailCredentials.userId,
        set: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          isActive: true,
          updatedAt: new Date()
        }
      })
      .returning();
    return upserted;
  }
  
  async deleteGmailCredentials(userId: string): Promise<void> {
    await db
      .delete(gmailCredentials)
      .where(eq(gmailCredentials.userId, userId));
  }
  
  async unlinkGmailCredentials(userId: string): Promise<void> {
    await db
      .update(gmailCredentials)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(gmailCredentials.userId, userId));
  }
}

export const storage = new DatabaseStorage();
