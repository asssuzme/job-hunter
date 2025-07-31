import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobScrapingRequests = pgTable("job_scraping_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkedinUrl: text("linkedin_url").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, processing, filtering, enriching, completed, failed
  results: jsonb("results"),
  filteredResults: jsonb("filtered_results"),
  enrichedResults: jsonb("enriched_results"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertJobScrapingRequestSchema = createInsertSchema(jobScrapingRequests).pick({
  linkedinUrl: true,
});

export type InsertJobScrapingRequest = z.infer<typeof insertJobScrapingRequestSchema>;
export type JobScrapingRequest = typeof jobScrapingRequests.$inferSelect;

// Validation schema for LinkedIn URL
export const linkedinUrlSchema = z.object({
  linkedinUrl: z.string()
    .url("Please enter a valid URL")
    .refine((url) => url.includes("linkedin.com"), "Please enter a LinkedIn URL")
    .refine((url) => url.includes("/jobs/"), "Please enter a LinkedIn job URL"),
});

// Type definitions for scraped job data
export const jobDataSchema = z.object({
  title: z.string(),
  company: z.object({
    name: z.string(),
    industry: z.string().optional(),
    size: z.string().optional(),
    founded: z.string().optional(),
    logo: z.string().optional(),
  }),
  location: z.string(),
  workType: z.string(),
  postedDate: z.string(),
  applicants: z.string().optional(),
  description: z.string(),
  skills: z.array(z.string()).optional(),
  originalUrl: z.string(),
  companyWebsite: z.string().optional(),
  companyLinkedinUrl: z.string().optional(),
  jobPosterName: z.string().optional(),
  jobPosterLinkedinUrl: z.string().optional(),
  requirement: z.string().optional(),
  salaryInfo: z.string().optional(),
});

export type JobData = z.infer<typeof jobDataSchema>;

// Filtered job data schema with required fields
export const filteredJobDataSchema = z.object({
  title: z.string(),
  companyName: z.string(),
  companyLogo: z.string().optional(),
  companyWebsite: z.string(),
  companyLinkedinUrl: z.string(),
  jobPosterName: z.string().optional(),
  jobPosterLinkedinUrl: z.string().optional(),
  jobPosterEmail: z.string().optional(),
  emailVerificationStatus: z.enum(['valid', 'catch-all', 'error', 'unknown']).optional(),
  requirement: z.string().optional(),
  location: z.string(),
  link: z.string(),
  salaryInfo: z.string().optional(),
  canApply: z.boolean().optional(),
});

export type FilteredJobData = z.infer<typeof filteredJobDataSchema>;

export const scrapingResultSchema = z.object({
  jobs: z.array(jobDataSchema),
  totalCount: z.number(),
  scrapedAt: z.string(),
});

export const filteredResultSchema = z.object({
  jobs: z.array(filteredJobDataSchema),
  totalCount: z.number(),
  originalCount: z.number(),
  filteredAt: z.string(),
});

export const enrichedResultSchema = z.object({
  jobs: z.array(filteredJobDataSchema),
  totalCount: z.number(),
  canApplyCount: z.number(),
  enrichedAt: z.string(),
});

export type ScrapingResult = z.infer<typeof scrapingResultSchema>;
export type FilteredResult = z.infer<typeof filteredResultSchema>;
export type EnrichedResult = z.infer<typeof enrichedResultSchema>;
