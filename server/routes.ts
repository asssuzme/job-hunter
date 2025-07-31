import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobScrapingRequestSchema, linkedinUrlSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new job scraping request
  app.post("/api/scrape-job", async (req, res) => {
    try {
      // Validate the request body
      const validation = linkedinUrlSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid LinkedIn URL", 
          errors: validation.error.errors 
        });
      }

      const { linkedinUrl } = validation.data;

      // Create the scraping request
      const request = await storage.createJobScrapingRequest({ linkedinUrl });
      
      // Start the scraping process asynchronously
      processJobScraping(request.id);

      res.json({ requestId: request.id, status: request.status });
    } catch (error) {
      console.error("Error creating scraping request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get scraping request status and results
  app.get("/api/scrape-job/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getJobScrapingRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Scraping request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching scraping request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processJobScraping(requestId: string) {
  try {
    // Update status to processing
    await storage.updateJobScrapingRequest(requestId, { 
      status: "processing" 
    });

    const request = await storage.getJobScrapingRequest(requestId);
    if (!request) return;

    // Prepare Apify request body
    const requestBody = {
      count: 100,
      scrapeCompany: true,
      urls: [request.linkedinUrl]
    };

    // Call Apify LinkedIn scraper API using the sync endpoint
    const response = await fetch("https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/run-sync-get-dataset-items?token=apify_api_HrPjMf1C0y5C8CyoiA5iAeJmjsjfLY0XXGHG", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const rawResults = await response.json();
    
    // Transform the results to match our schema
    const transformedJobs = rawResults.map((item: any) => ({
      title: item.title || "N/A",
      company: {
        name: item.companyName || item.company || "N/A",
        industry: item.industry,
        size: item.companySize,
        founded: item.founded,
        logo: item.companyLogo
      },
      location: item.location || "N/A",
      workType: item.employmentType || item.workType || "N/A",
      postedDate: item.postedDate || item.datePosted || "N/A",
      applicants: item.applicants,
      description: item.description || item.jobDescription || "No description available",
      skills: item.skills || [],
      originalUrl: item.url || item.jobUrl || request.linkedinUrl
    }));

    const results = {
      jobs: transformedJobs,
      totalCount: transformedJobs.length,
      scrapedAt: new Date().toISOString()
    };

    await storage.updateJobScrapingRequest(requestId, {
      status: "completed",
      results,
      completedAt: new Date()
    });

  } catch (error) {
    console.error("Error processing job scraping:", error);
    await storage.updateJobScrapingRequest(requestId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      completedAt: new Date()
    });
  }
}
