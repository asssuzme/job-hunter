import { type JobScrapingRequest, type InsertJobScrapingRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getJobScrapingRequest(id: string): Promise<JobScrapingRequest | undefined>;
  createJobScrapingRequest(request: InsertJobScrapingRequest): Promise<JobScrapingRequest>;
  updateJobScrapingRequest(id: string, updates: Partial<JobScrapingRequest>): Promise<JobScrapingRequest | undefined>;
  getJobScrapingRequestsByStatus(status: string): Promise<JobScrapingRequest[]>;
}

export class MemStorage implements IStorage {
  private jobRequests: Map<string, JobScrapingRequest>;

  constructor() {
    this.jobRequests = new Map();
  }

  async getJobScrapingRequest(id: string): Promise<JobScrapingRequest | undefined> {
    return this.jobRequests.get(id);
  }

  async createJobScrapingRequest(insertRequest: InsertJobScrapingRequest): Promise<JobScrapingRequest> {
    const id = randomUUID();
    const request: JobScrapingRequest = {
      ...insertRequest,
      id,
      status: "pending",
      results: null,
      errorMessage: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.jobRequests.set(id, request);
    return request;
  }

  async updateJobScrapingRequest(id: string, updates: Partial<JobScrapingRequest>): Promise<JobScrapingRequest | undefined> {
    const existing = this.jobRequests.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.jobRequests.set(id, updated);
    return updated;
  }

  async getJobScrapingRequestsByStatus(status: string): Promise<JobScrapingRequest[]> {
    return Array.from(this.jobRequests.values()).filter(request => request.status === status);
  }
}

export const storage = new MemStorage();
