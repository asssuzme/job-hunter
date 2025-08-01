import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { 
  insertJobScrapingRequestSchema, 
  linkedinUrlSchema,
  type FilteredJobData, 
  type JobData,
  type User 
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create a new job scraping request (now requires authentication)
  app.post("/api/scrape-job", isAuthenticated, async (req: any, res) => {
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
      const { resumeText } = req.body; // Get optional resume text
      
      // Clean the resume text to remove null bytes and other invalid characters
      const cleanedResumeText = resumeText ? resumeText.replace(/\0/g, '').trim() : null;

      // Create the scraping request with optional resume
      const userId = req.user.claims.sub;
      const request = await storage.createJobScrapingRequest({ 
        linkedinUrl,
        resumeText: cleanedResumeText,
        userId: userId
      });
      
      // Start the scraping process asynchronously
      processJobScraping(request.id);

      res.json({ requestId: request.id, status: request.status });
    } catch (error) {
      console.error("Error creating scraping request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's scraping requests
  app.get("/api/scrape-jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getJobScrapingRequestsByUser(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user's scraping requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get scraping request status and results
  app.get("/api/scrape-job/:id", isAuthenticated, async (req: any, res) => {
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

  // Cancel a scraping request
  app.post("/api/scrape-job/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getJobScrapingRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Scraping request not found" });
      }

      if (request.status === "completed" || request.status === "failed" || request.status === "cancelled") {
        return res.status(400).json({ message: "Cannot cancel a request that is already complete" });
      }

      await storage.cancelJobScrapingRequest(id);
      res.json({ success: true, message: "Scraping request cancelled" });
    } catch (error) {
      console.error("Error cancelling scraping request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Parse PDF file to extract text
  app.post("/api/parse-pdf", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create a simple workaround for pdf-parse initialization issue
      const fs = await import('fs');
      const path = await import('path');
      
      // Create the expected test directory structure temporarily
      const testDir = path.join(process.cwd(), 'test', 'data');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // Create a dummy test file that pdf-parse expects
      const testFile = path.join(testDir, '05-versions-space.pdf');
      if (!fs.existsSync(testFile)) {
        fs.writeFileSync(testFile, '');
      }
      
      // Now import pdf-parse after creating the expected structure
      const pdfParse = (await import("pdf-parse")).default;
      
      // Parse the PDF buffer
      const data = await pdfParse(req.file.buffer);
      
      // Clean up the temporary files
      try {
        fs.unlinkSync(testFile);
        fs.rmdirSync(testDir);
        fs.rmdirSync(path.join(process.cwd(), 'test'));
      } catch (e) {
        // Ignore cleanup errors
      }
      
      // Clean the text to remove null bytes and other invalid characters
      const cleanedText = data.text.replace(/\0/g, '').trim();
      
      res.json({ text: cleanedText });
    } catch (error) {
      console.error("Error parsing PDF:", error);
      res.status(500).json({ error: "Failed to parse PDF file" });
    }
  });

  // Scrape company profile
  app.post("/api/scrape-company", async (req, res) => {
    try {
      const { companyLinkedinUrl } = req.body;
      
      if (!companyLinkedinUrl) {
        return res.status(400).json({ error: "Company LinkedIn URL is required" });
      }

      console.log("🏢 Scraping company profile:", companyLinkedinUrl);
      
      const apiUrl = 'https://api.apify.com/v2/acts/fetchclub~linkedin-company-profiles-scraper/run-sync-get-dataset-items?token=apify_api_4zPr6hJ4tX3HD8Iqkc5WjRx4Q54biX11P0vs';
      
      const requestBody = {
        company_profile_urls: [companyLinkedinUrl]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Company scraping API error: ${response.status} - ${errorText}`);
        return res.status(500).json({ error: "Failed to scrape company profile" });
      }

      const companyData = await response.json();
      console.log("Company profile scraped successfully:", companyData);

      // Return the first company profile from the results
      const profile = companyData[0] || {};
      
      res.json({
        success: true,
        company: {
          name: profile.name || profile.companyName,
          description: profile.description || profile.about,
          industry: profile.industry,
          size: profile.size || profile.companySize,
          headquarters: profile.headquarters || profile.location,
          website: profile.website,
          specialties: profile.specialties || [],
          founded: profile.founded,
          employees: profile.employees || profile.employeeCount,
          logo: profile.logo || profile.logoUrl,
          tagline: profile.tagline,
          updates: profile.updates || [],
          linkedinUrl: companyLinkedinUrl
        }
      });
    } catch (error) {
      console.error("Error scraping company profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate application email using OpenAI
  app.post("/api/generate-email", async (req, res) => {
    try {
      const { 
        companyData, 
        jobPosterData, 
        jobDescription, 
        jobTitle,
        recipientEmail,
        resumeText 
      } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Extract relevant data from company profile
      const companyInfo = {
        name: companyData?.name || companyData?.company_name || "the company",
        about: companyData?.description || companyData?.company_about_us || companyData?.about,
        industry: companyData?.industry || companyData?.company_industry,
        twitterDescription: companyData?.company_twitter_description
      };

      // Extract relevant data from job poster profile
      const posterInfo = {
        name: jobPosterData?.name || jobPosterData?.fullName || "Hiring Manager",
        headline: jobPosterData?.headline || jobPosterData?.Headline,
        jobTitle: jobPosterData?.jobTitle || jobPosterData?.currentJobTitle,
        about: jobPosterData?.about || jobPosterData?.summary
      };

      const prompt = `You are an expert job application email writer. Generate a personalized, professional email application based on the following information:

COMPANY INFORMATION:
- Company Name: ${companyInfo.name}
- About: ${companyInfo.about || "Not provided"}
- Industry: ${companyInfo.industry || "Not provided"}
- Twitter Description: ${companyInfo.twitterDescription || "Not provided"}

JOB POSTER/RECIPIENT:
- Name: ${posterInfo.name}
- Current Role: ${posterInfo.headline || posterInfo.jobTitle || "Not provided"}
- About: ${posterInfo.about || "Not provided"}

JOB DETAILS:
- Job Title: ${jobTitle}
- Job Description: ${jobDescription}

${resumeText ? `APPLICANT'S RESUME:
${resumeText}

Use the resume information to:
- Highlight specific relevant experiences and achievements
- Match the applicant's skills with job requirements
- Reference specific accomplishments that align with the company's needs
- Demonstrate how their background makes them a perfect fit for this role
` : ''}

Write a compelling email that:
1. Addresses the recipient by name (or "Hiring Manager" if name not available)
2. Shows genuine interest in the company based on the company information
3. Demonstrates understanding of the role based on the job description
4. ${resumeText ? 'Highlights specific experiences from the resume that match the requirements' : 'Highlights how the applicant\'s skills match the requirements'}
5. References specific aspects of the company or role to show research
6. ${resumeText ? 'Mentions quantifiable achievements from the resume when relevant' : 'Maintains professional tone'}
7. Includes a clear call to action
8. Is concise (around 250-300 words)

Format the email with proper structure including greeting, body paragraphs, and professional closing.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      const generatedEmail = response.choices[0].message.content;

      res.json({
        success: true,
        email: generatedEmail,
        recipientEmail: recipientEmail
      });

    } catch (error) {
      console.error("Error generating email:", error);
      res.status(500).json({ error: "Failed to generate email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function filterJobs(jobs: JobData[]): FilteredJobData[] {
  // Filter jobs to keep only those with required fields
  const validJobs = jobs.filter(job => 
    job.company.name && 
    job.companyWebsite && 
    job.companyLinkedinUrl
  );

  // Group by company name and keep only the first job from each company
  const companyMap = new Map<string, FilteredJobData>();
  
  for (const job of validJobs) {
    const companyName = job.company.name.trim().toLowerCase();
    
    if (!companyMap.has(companyName)) {
      companyMap.set(companyName, {
        title: job.title,
        companyName: job.company.name,
        companyLogo: job.company.logo,
        companyWebsite: job.companyWebsite!,
        companyLinkedinUrl: job.companyLinkedinUrl!,
        jobPosterName: job.jobPosterName,
        jobPosterLinkedinUrl: job.jobPosterLinkedinUrl,
        requirement: job.requirement,
        location: job.location,
        link: job.originalUrl,
        salaryInfo: job.salaryInfo
      });
    }
  }

  return Array.from(companyMap.values());
}

async function enrichJobsWithProfiles(jobs: FilteredJobData[]): Promise<FilteredJobData[]> {
  // Get jobs that have poster LinkedIn URLs - be very specific about checking
  const jobsWithProfiles = jobs.filter((job: FilteredJobData) => {
    const hasUrl = job.jobPosterLinkedinUrl && job.jobPosterLinkedinUrl.trim() !== '' && job.jobPosterLinkedinUrl !== 'N/A';
    if (hasUrl) {
      console.log(`Job "${job.title}" has valid poster URL: ${job.jobPosterLinkedinUrl}`);
    }
    return hasUrl;
  });
  
  console.log(`FILTERING RESULTS: Found ${jobsWithProfiles.length} jobs with valid LinkedIn profile URLs out of ${jobs.length} total filtered jobs`);
  
  if (jobsWithProfiles.length === 0) {
    console.log("❌ NO JOBS WITH LINKEDIN PROFILE URLs FOUND - All jobs will be marked as 'Cannot Apply'");
    console.log("Jobs without profile URLs:", jobs.map(job => ({
      title: job.title,
      posterName: job.jobPosterName,
      posterUrl: job.jobPosterLinkedinUrl
    })));
    return jobs.map(job => ({ ...job, canApply: false }));
  }

  try {
    // Extract profile URLs for batch scraping
    const profileUrls = jobsWithProfiles.map(job => job.jobPosterLinkedinUrl!);
    console.log("Profile URLs to scrape:", profileUrls);

    const requestBody = {
      profileUrls: profileUrls
    };
    console.log("Sending request to profile scraper:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      "https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=apify_api_HrPjMf1C0y5C8CyoiA5iAeJmjsjfLY0XXGHG",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("Profile scraper response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Profile scraping failed:", response.status, response.statusText, errorText);
      return jobs.map(job => ({ ...job, canApply: false }));
    }

    const profileResults = await response.json();
    console.log("\n🔍 PROFILE SCRAPER RESPONSE ANALYSIS:");
    console.log("Response type:", typeof profileResults);
    console.log("Is array:", Array.isArray(profileResults));
    console.log("Results count:", profileResults.length);
    
    // Log the complete structure of the first result
    if (profileResults.length > 0) {
      console.log("\n📋 FIRST PROFILE RESULT - COMPLETE STRUCTURE:");
      console.log(JSON.stringify(profileResults[0], null, 2));
      
      // Also log specific fields we're interested in
      console.log("\n🔑 KEY FIELDS FROM FIRST RESULT:");
      const firstResult = profileResults[0];
      console.log("email field:", firstResult.email);
      console.log("Email field:", firstResult.Email);
      console.log("profileUrl field:", firstResult.profileUrl);
      console.log("url field:", firstResult.url);
      console.log("linkedinUrl field:", firstResult.linkedinUrl);
      console.log("publicIdentifier field:", firstResult.publicIdentifier);
    }
    
    // Create a map of profile URL to email
    const profileEmailMap = new Map<string, string>();
    
    if (Array.isArray(profileResults)) {
      profileResults.forEach((profile: any, index: number) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Processing profile ${index + 1}/${profileResults.length}:`);
        console.log("Raw profile data:", JSON.stringify(profile).substring(0, 200) + "...");
        
        // Check all possible email fields
        const email = profile.email || 
                     profile.Email || 
                     profile.contactInfo?.email || 
                     profile.publicContactInfo?.email ||
                     null;
        
        console.log("📧 Email extraction:");
        console.log("  - profile.email:", profile.email);
        console.log("  - profile.Email:", profile.Email);
        console.log("  - Final extracted email:", email);
        
        // For profile URL, we need to match what we sent
        // The API might return the URL in a different field
        const sentUrl = profileUrls[index];
        console.log("🔗 URL matching:");
        console.log("  - URL we sent:", sentUrl);
        console.log("  - profile.profileUrl:", profile.profileUrl);
        console.log("  - profile.url:", profile.url);
        
        if (email && email !== "null" && email !== null) {
          // Use the URL we sent as the key since that's what we'll use for matching
          profileEmailMap.set(sentUrl, email);
          console.log(`✅ SUCCESSFULLY MAPPED: ${sentUrl} → ${email}`);
        } else {
          console.log(`❌ NO EMAIL FOUND for ${sentUrl}`);
        }
      });
    } else {
      console.log("❌ Profile results is not an array:", typeof profileResults);
    }

    console.log("\n📊 PROFILE EMAIL MAP SUMMARY:");
    console.log("Total profiles with emails:", profileEmailMap.size);
    console.log("Email mappings:", Array.from(profileEmailMap.entries()));

    // Enrich jobs with profile data
    const enrichedJobs = jobs.map(job => {
      let email: string | undefined = undefined;
      
      if (job.jobPosterLinkedinUrl) {
        console.log(`\n🔎 Searching email for job "${job.title}"`);
        console.log(`  Job poster URL: ${job.jobPosterLinkedinUrl}`);
        
        // Try exact match first
        email = profileEmailMap.get(job.jobPosterLinkedinUrl);
        if (email) {
          console.log(`  ✅ Found email via exact match: ${email}`);
        } else {
          console.log(`  ❌ No exact match found, trying normalized versions...`);
          
          // Normalize the job poster URL
          const normalizedJobUrl = job.jobPosterLinkedinUrl.trim().toLowerCase();
          
          // Try to find a matching profile URL
          const entries = Array.from(profileEmailMap.entries());
          for (const [profileUrl, profileEmail] of entries) {
            const normalizedProfileUrl = profileUrl.toLowerCase();
            
            // Check if URLs match (with or without trailing slash, http/https, www)
            if (normalizedJobUrl === normalizedProfileUrl ||
                normalizedJobUrl.replace(/\/$/, '') === normalizedProfileUrl.replace(/\/$/, '') ||
                normalizedJobUrl.replace('https://', '').replace('http://', '').replace('www.', '') === 
                normalizedProfileUrl.replace('https://', '').replace('http://', '').replace('www.', '')) {
              email = profileEmail;
              console.log(`  ✅ Found email via normalized match: ${email}`);
              console.log(`     Job URL: ${job.jobPosterLinkedinUrl}`);
              console.log(`     Profile URL: ${profileUrl}`);
              break;
            }
          }
          
          if (!email) {
            console.log(`  ❌ No email found after normalization attempts`);
          }
        }
      } else {
        console.log(`\n⚠️ Job "${job.title}" has no poster LinkedIn URL`);
      }
      
      const canApply = !!email;
      
      return {
        ...job,
        jobPosterEmail: email,
        canApply: canApply
      };
    });

    const canApplyCount = enrichedJobs.filter(job => job.canApply).length;
    console.log(`Enrichment complete: ${canApplyCount} out of ${enrichedJobs.length} jobs can apply`);

    return enrichedJobs;

  } catch (error) {
    console.error("Error enriching profiles:", error);
    return jobs.map(job => ({ ...job, canApply: false }));
  }
}

async function verifyEmails(jobs: any[]) {
  try {
    // Extract emails from jobs that can apply
    const emailsToVerify = jobs
      .filter(job => job.canApply && job.jobPosterEmail)
      .map(job => job.jobPosterEmail);

    if (emailsToVerify.length === 0) {
      console.log("No emails to verify");
      return jobs;
    }

    console.log(`\n📧 Verifying ${emailsToVerify.length} emails...`);
    
    const verificationUrl = 'https://api.apify.com/v2/acts/devil_port369-owner~email-verifier/run-sync-get-dataset-items?token=apify_api_4zPr6hJ4tX3HD8Iqkc5WjRx4Q54biX11P0vs';
    
    const requestBody = {
      emails: emailsToVerify,
      proxy: {
        useApifyProxy: true,
        groups: ["RESIDENTIAL"]
      }
    };

    console.log("Email verification request:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email verification API error: ${response.status} - ${errorText}`);
      // Return jobs with unknown status if verification fails
      return jobs.map(job => ({
        ...job,
        emailVerificationStatus: job.canApply ? 'unknown' : undefined
      }));
    }

    const verificationResults = await response.json();
    console.log("Email verification results:", JSON.stringify(verificationResults, null, 2));

    // Create a map of email to verification status
    const emailStatusMap = new Map();
    verificationResults.forEach((result: any) => {
      const email = result.email || result.Email;
      const status = result.status || result.email_status || result.result || 'unknown';
      
      // Normalize status values
      let normalizedStatus = 'unknown';
      if (status.toLowerCase().includes('valid')) {
        normalizedStatus = 'valid';
      } else if (status.toLowerCase().includes('catch')) {
        normalizedStatus = 'catch-all';
      } else if (status.toLowerCase().includes('error') || status.toLowerCase().includes('invalid')) {
        normalizedStatus = 'error';
      }
      
      emailStatusMap.set(email, normalizedStatus);
      console.log(`Email ${email} verification status: ${normalizedStatus}`);
    });

    // Update jobs with verification status
    const verifiedJobs = jobs.map(job => {
      if (job.canApply && job.jobPosterEmail) {
        const verificationStatus = emailStatusMap.get(job.jobPosterEmail) || 'unknown';
        return {
          ...job,
          emailVerificationStatus: verificationStatus
        };
      }
      return job;
    });

    const verifiedCount = verifiedJobs.filter(job => job.emailVerificationStatus === 'valid').length;
    console.log(`\n✅ Email verification complete: ${verifiedCount} valid emails out of ${emailsToVerify.length} verified`);

    return verifiedJobs;

  } catch (error) {
    console.error("Error verifying emails:", error);
    // Return jobs with unknown status if verification fails
    return jobs.map(job => ({
      ...job,
      emailVerificationStatus: job.canApply ? 'unknown' : undefined
    }));
  }
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
    console.log("Raw job scraping results sample:", JSON.stringify(rawResults.slice(0, 2), null, 2));
    console.log("Total jobs scraped:", rawResults.length);
    
    // Transform the results to match our schema
    const transformedJobs = rawResults.map((item: any, index: number) => {
      // Check all possible field names for job poster profile URL
      const jobPosterProfileUrl = item.jobPosterProfileUrl || 
                                 item.posterUrl || 
                                 item.recruiterUrl || 
                                 item.hiringManagerUrl || 
                                 item.jobPosterLinkedinUrl ||
                                 item.posterLinkedinUrl ||
                                 item.recruiterLinkedinUrl ||
                                 item.hiringManagerLinkedinUrl;

      const jobPosterName = item.jobPosterName || 
                           item.posterName || 
                           item.recruiterName || 
                           item.hiringManagerName;

      console.log(`Job ${index + 1} "${item.title || 'N/A'}":`, {
        hasJobPosterProfileUrl: !!jobPosterProfileUrl,
        jobPosterProfileUrl: jobPosterProfileUrl,
        hasJobPosterName: !!jobPosterName,
        jobPosterName: jobPosterName,
        availableFields: Object.keys(item)
      });

      const job = {
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
        originalUrl: item.url || item.jobUrl || request.linkedinUrl,
        companyWebsite: item.companyWebsite || item.website,
        companyLinkedinUrl: item.companyLinkedinUrl || item.companyUrl,
        jobPosterName: jobPosterName,
        jobPosterLinkedinUrl: jobPosterProfileUrl,
        requirement: item.requirement || item.requirements,
        salaryInfo: item.salaryInfo || item.salary
      };
      
      return job;
    });

    const jobsWithPosters = transformedJobs.filter((job: any) => job.jobPosterLinkedinUrl);
    console.log(`Found ${jobsWithPosters.length} jobs with job poster profile URLs out of ${transformedJobs.length} total jobs`);

    const results = {
      jobs: transformedJobs,
      totalCount: transformedJobs.length,
      scrapedAt: new Date().toISOString()
    };

    // Update status to filtering
    await storage.updateJobScrapingRequest(requestId, {
      status: "filtering",
      results
    });

    // Apply filtering logic
    const filteredJobs = filterJobs(transformedJobs);
    
    const filteredResults = {
      jobs: filteredJobs,
      totalCount: filteredJobs.length,
      originalCount: transformedJobs.length,
      filteredAt: new Date().toISOString()
    };

    await storage.updateJobScrapingRequest(requestId, {
      status: "enriching",
      filteredResults
    });

    // Profile enrichment step
    const enrichedJobs = await enrichJobsWithProfiles(filteredJobs);
    
    // Email verification step
    console.log('\n📧 Step 4: Starting email verification...');
    const verifiedJobs = await verifyEmails(enrichedJobs);
    
    const enrichedResults = {
      jobs: verifiedJobs,
      totalCount: verifiedJobs.length,
      canApplyCount: verifiedJobs.filter(job => job.canApply).length,
      enrichedAt: new Date().toISOString()
    };

    await storage.updateJobScrapingRequest(requestId, {
      status: "completed",
      enrichedResults,
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
