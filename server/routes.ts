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

    // Get Apify API key from environment
    const apifyApiKey = process.env.APIFY_API_KEY || process.env.APIFY_TOKEN;
    if (!apifyApiKey) {
      throw new Error("Apify API key not found in environment variables");
    }

    // Prepare Apify request body
    const requestBody = {
      startUrls: [{ url: request.linkedinUrl }],
      scrapeCompany: true,
      count: 100
    };

    // Call Apify LinkedIn scraper API
    const response = await fetch("https://api.apify.com/v2/acts/trudax~linkedin-job-scraper/runs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apifyApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/trudax~linkedin-job-scraper/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${apifyApiKey}`
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data.status;
        
        if (status === "SUCCEEDED") {
          completed = true;
          
          // Get the results
          const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
            headers: {
              "Authorization": `Bearer ${apifyApiKey}`
            }
          });

          if (resultsResponse.ok) {
            const rawResults = await resultsResponse.json();
            
            // Transform the results to match our schema
            const transformedJobs = rawResults.map((item: any) => ({
              title: item.title || "N/A",
              company: {
                name: item.companyName || "N/A",
                industry: item.industry,
                size: item.companySize,
                founded: item.founded,
                logo: item.companyLogo
              },
              location: item.location || "N/A",
              workType: item.employmentType || "N/A",
              postedDate: item.postedDate || "N/A",
              applicants: item.applicants,
              description: item.description || "No description available",
              skills: item.skills || [],
              originalUrl: item.url || request.linkedinUrl
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
          } else {
            throw new Error("Failed to fetch results from Apify");
          }
        } else if (status === "FAILED") {
          throw new Error("Apify job scraping failed");
        }
      }
      
      attempts++;
    }

    if (!completed) {
      throw new Error("Scraping timed out");
    }

  } catch (error) {
    console.error("Error processing job scraping:", error);
    await storage.updateJobScrapingRequest(requestId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      completedAt: new Date()
    });
  }
}
