import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSupabaseAuth, isAuthenticated } from "./supabaseAuth";
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
import express from "express";
import session from "express-session";
import { getSession } from "./googleAuth";

// Token refresh function
async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      console.error('Token refresh failed:', await response.text());
      return null;
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Auth middleware
  setupSupabaseAuth(app);

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const stats = await storage.getDashboardStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics endpoint with real data
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Get all email applications for the user
      const emailApplications = await storage.getEmailApplicationsByUser(user.id);
      
      // Get all job scraping requests for the user
      const scrapingRequests = await storage.getJobScrapingRequestsByUser(user.id);
      
      // Calculate total applications sent
      const totalApplications = emailApplications.length;
      
      // These metrics are not tracked yet, so we'll return 0
      const responseRate = 0;
      const averageResponseTime = 0;
      const interviewsScheduled = 0;
      
      // Calculate weekly applications for the last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const weeklyApplications = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(fourWeeksAgo);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const count = emailApplications.filter(app => {
          const sentDate = new Date(app.sentAt);
          return sentDate >= weekStart && sentDate < weekEnd;
        }).length;
        
        weeklyApplications.push({
          week: `Week ${i + 1}`,
          count: count
        });
      }
      
      res.json({
        totalApplications,
        responseRate,
        averageResponseTime: parseFloat(averageResponseTime as string),
        interviewsScheduled,
        weeklyApplications,
        totalJobsScraped: scrapingRequests.filter(r => r.status === 'completed').length
      });
    } catch (error) {
      console.error("Error fetching analytics stats:", error);
      res.status(500).json({ message: "Failed to fetch analytics stats" });
    }
  });
  
  // Get email applications endpoint
  app.get('/api/email-applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const applications = await storage.getEmailApplicationsByUser(user.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching email applications:", error);
      res.status(500).json({ message: "Failed to fetch email applications" });
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
      const user = req.user;
      const request = await storage.createJobScrapingRequest({ 
        linkedinUrl,
        resumeText: cleanedResumeText,
        userId: user.id
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
      const user = req.user;
      const requests = await storage.getJobScrapingRequestsByUser(user.id);
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

  // Check if user has a resume
  app.get("/api/user/resume", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      console.log("Get resume - User ID:", userId);
      console.log("Get resume - User object:", req.user);
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const resumeData = await storage.getUserResume(userId);
      console.log("Resume data from database:", resumeData);
      
      res.json({
        hasResume: !!resumeData?.resumeText,
        fileName: resumeData?.resumeFileName || null,
        uploadedAt: resumeData?.resumeUploadedAt || null,
        resumeText: resumeData?.resumeText || null
      });
    } catch (error) {
      console.error("Error fetching user resume:", error);
      res.status(500).json({ error: "Failed to fetch resume data" });
    }
  });

  // Upload resume endpoint
  app.post("/api/upload-resume", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let text = "";
      
      // Check if the file is a PDF or text file
      if (req.file.mimetype === "application/pdf") {
        // Use the PDF parsing logic
        const fs = await import('fs');
        const path = await import('path');
        
        const testDir = path.join(process.cwd(), 'test', 'data');
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        const testFile = path.join(testDir, '05-versions-space.pdf');
        if (!fs.existsSync(testFile)) {
          fs.writeFileSync(testFile, '');
        }
        
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(req.file.buffer);
        
        try {
          fs.unlinkSync(testFile);
          fs.rmdirSync(testDir);
          fs.rmdirSync(path.join(process.cwd(), 'test'));
        } catch (e) {
          // Ignore cleanup errors
        }
        
        text = data.text;
      } else if (req.file.mimetype === "text/plain") {
        text = req.file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: "Invalid file type. Please upload a PDF or text file." });
      }
      
      // Clean the text to remove null bytes and other invalid characters
      const cleanedText = text.replace(/\0/g, '').trim();
      
      // Save the resume to the user's database record
      const userId = req.user?.id;
      console.log("Upload resume - User ID:", userId);
      console.log("Upload resume - User object:", req.user);
      
      if (userId) {
        console.log("Saving resume to database for user:", userId);
        await storage.updateUserResume(userId, cleanedText, req.file.originalname);
      } else {
        console.log("No user ID found, resume not saved to database");
      }
      
      res.json({ text: cleanedText });
    } catch (error) {
      console.error("Error processing resume:", error);
      res.status(500).json({ error: "Failed to process resume file" });
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

  // Generate LinkedIn search URL using OpenAI
  app.post("/api/generate-linkedin-url", isAuthenticated, async (req: any, res) => {
    try {
      const { keyword, location, workType } = req.body;
      
      if (!keyword || !location || !workType) {
        return res.status(400).json({ 
          error: "Missing required fields: keyword, location, and workType are required" 
        });
      }

      // LinkedIn geoId mapping for countries and cities
      const locationGeoIds: Record<string, string> = {
        // Countries
        "united states": "103644278",
        "usa": "103644278",
        "us": "103644278",
        "america": "103644278",
        "india": "102713980",
        "china": "102890883",
        "japan": "101355337",
        "singapore": "102454443",
        "france": "105015875",
        "belgium": "100565514",
        "spain": "105646813",
        "united kingdom": "102299470",
        "uk": "102299470",
        "england": "102299470",
        "britain": "102299470",
        "germany": "101282230",
        "italy": "103350119",
        "canada": "101174742",
        "australia": "101452733",
        "brazil": "106057199",
        "mexico": "103323778",
        "netherlands": "102890719",
        "switzerland": "106693272",
        "sweden": "105117694",
        "south korea": "105149562",
        "korea": "105149562",
        "russia": "101728296",
        "united arab emirates": "104305776",
        "uae": "104305776",
        "dubai": "104305776",
        
        // Indian cities
        "bengaluru": "105214831",
        "bangalore": "105214831",
        "mumbai": "106164952",
        "bombay": "106164952",
        "delhi": "102713980",
        "new delhi": "102713980",
        "chennai": "114467055",
        "madras": "114467055",
        "hyderabad": "104076507",
        "kolkata": "102282711",
        "calcutta": "102282711",
        "pune": "114806696",
        "ahmedabad": "104035573",
        "jaipur": "104522388",
        "lucknow": "103150703",
        "noida": "103144308",
        "gurugram": "105373241",
        "gurgaon": "105373241",
        "indore": "105413271",
        "kochi": "104905452",
        "cochin": "104905452",
      };

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Use OpenAI to normalize the location
      const locationPrompt = `Given a user's location input "${location}", find and return the correct LinkedIn geoId for that exact city or country by searching LinkedIn's location taxonomy from this list: ${Object.keys(locationGeoIds).filter((city, index, arr) => arr.indexOf(city) === index).join(", ")}. 
      
      CRITICAL REQUIREMENTS:
      - Never substitute with a nearby or similar location
      - Only return the exact match for the user's requested location
      - If uncertain or no exact match exists, return "NO_MATCH" instead of guessing
      
      Return only the exact location name in lowercase if found, or "NO_MATCH" if not found. No explanations.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a location normalizer. Return only the normalized city name in lowercase." },
          { role: "user", content: locationPrompt }
        ],
        max_tokens: 50,
      });

      const normalizedLocation = completion.choices[0].message.content?.trim().toLowerCase() || "";
      
      // Check if AI returned NO_MATCH
      if (normalizedLocation === "no_match") {
        return res.status(400).json({ 
          error: `No LinkedIn location found for "${location}". Please try a different city name.`,
          originalLocation: location
        });
      }
      
      const geoId = locationGeoIds[normalizedLocation];

      if (!geoId) {
        // This shouldn't happen if AI follows instructions, but handle it just in case
        return res.status(400).json({ 
          error: `No LinkedIn location found for "${location}". Please try a different city name.`,
          originalLocation: location
        });
      }

      // Construct LinkedIn URL
      const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&geoId=${geoId}&f_WT=${workType}`;
      
      res.json({ 
        linkedinUrl,
        normalizedLocation,
        originalLocation: location
      });

    } catch (error) {
      console.error("Error generating LinkedIn URL:", error);
      res.status(500).json({ error: "Failed to generate LinkedIn URL" });
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
      
      const apiUrl = 'https://api.apify.com/v2/acts/fetchclub~linkedin-company-profiles-scraper/run-sync-get-dataset-items?token=apify_api_9dhAJl3j2KT3Ew2l5Na8I8r0byW2Gn3QVX4g';
      
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
  app.post("/api/generate-email", isAuthenticated, async (req, res) => {
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

  // Save email draft (Supabase-only solution)
  app.post("/api/send-email", isAuthenticated, async (req: any, res) => {
    try {
      const { 
        to, 
        subject, 
        body,
        attachments,
        jobTitle,
        companyName,
        jobUrl,
        companyWebsite
      } = req.body;

      // Since we can't send emails directly through Supabase,
      // we'll save the draft and provide a mailto link
      
      // Generate a unique draft ID
      const draftId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Save email draft record
      if (req.user && jobTitle && companyName) {
        try {
          await storage.createEmailApplication({
            userId: req.user.id,
            jobTitle,
            companyName,
            companyEmail: to,
            emailSubject: subject,
            emailBody: body,
            jobUrl,
            companyWebsite,
            gmailMessageId: draftId
          });
        } catch (error) {
          console.error("Error saving email draft:", error);
          // Don't fail the whole request if saving fails
        }
      }
      
      // Convert HTML to plain text for mailto link
      const plainTextBody = body
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      // Create mailto link (limited to 2000 chars for compatibility)
      const mailtoBody = plainTextBody.length > 1900 
        ? plainTextBody.substring(0, 1900) + '...' 
        : plainTextBody;
      
      const mailtoLink = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtoBody)}`;
      
      res.json({
        success: true,
        draftId: draftId,
        message: "Email draft saved successfully!",
        mailtoLink: mailtoLink,
        emailContent: {
          to,
          subject,
          body,
          plainTextBody
        }
      });

    } catch (error) {
      console.error("Error saving email draft:", error);
      res.status(500).json({ error: "Failed to save email draft" });
    }
  });

  // Add CASHFREE_BASE_URL constant for this route
  const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com/pg';
  
  // Test Cashfree endpoint
  app.get('/api/test-cashfree', async (req, res) => {
    try {
      const testData = {
        clientId: process.env.CASHFREE_APP_ID || "CF256745D26V5Q8DRH1C73B2GCQ0",
        hasSecret: !!(process.env.CASHFREE_SECRET_KEY || "cfsk_ma_test_91917faa134e12e9b40980b7a2481ac0_b5a59d99"),
        baseUrl: CASHFREE_BASE_URL
      };
      res.json({ status: "ok", config: testData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Cashfree payment session endpoint
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const user = req.user;

    try {
      // Check if user already has an active subscription
      if (user.subscription_status === 'active' && user.subscription_expires_at) {
        const expiryDate = new Date(user.subscription_expires_at);
        if (expiryDate > new Date()) {
          return res.status(400).json({ error: "You already have an active subscription" });
        }
      }

      // Generate unique order ID
      const orderId = `order_${user.id}_${Date.now()}`;
      
      // Import Cashfree service V2
      const { createCashfreeOrderV2 } = await import("./services/cashfreeV2");
      
      // Create Cashfree order
      const orderData = {
        orderId: orderId,
        orderAmount: 129.00, // ₹129 per month
        orderCurrency: "INR",
        customerDetails: {
          customerId: user.id,
          customerEmail: user.email,
          customerPhone: "9999999999", // Default phone without country code
          customerName: user.username || user.email.split('@')[0]
        },
        orderMeta: {
          return_url: `${process.env.BASE_URL || (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000')}/api/payment/return`,
          notify_url: `${process.env.BASE_URL || (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000')}/api/payment/webhook`
        }
      };

      console.log("Creating Cashfree order for user:", user.email);
      const cashfreeOrder = await createCashfreeOrderV2(orderData);
      
      // Store order ID in database for later verification
      await storage.updateUser(user.id, {
        pending_payment_order_id: orderId
      });
      
      // The correct payment link format for Cashfree hosted checkout
      // According to Cashfree docs, we need to create a payment link using the payment_session_id
      const paymentLink = `https://sandbox.cashfree.com/pg/view/session/${cashfreeOrder.payment_session_id}`;
      console.log("Generated payment link:", paymentLink);
      console.log("Full Cashfree response:", JSON.stringify(cashfreeOrder, null, 2));
      
      res.json({
        orderId: cashfreeOrder.order_id,
        cfOrderId: cashfreeOrder.cf_order_id,
        paymentSessionId: cashfreeOrder.payment_session_id,
        orderToken: cashfreeOrder.order_token,
        paymentLink: paymentLink,
        orderAmount: cashfreeOrder.order_amount,
        orderCurrency: cashfreeOrder.order_currency
      });
      
    } catch (error: any) {
      console.error("Error creating payment session:", error);
      
      // Check for IP whitelist error
      if (error.message && error.message.includes("IP address not allowed")) {
        res.status(403).json({ 
          error: "Your server's IP address needs to be whitelisted in Cashfree. Please check CASHFREE_IP_WHITELIST_GUIDE.md for instructions.",
          details: error.message 
        });
      } else {
        res.status(500).json({ error: error.message || "Failed to create payment session" });
      }
    }
  });
  
  // Payment return URL handler
  app.get('/api/payment/return', async (req: any, res) => {
    const { order_id } = req.query;
    
    if (!order_id) {
      return res.redirect('/subscribe?error=invalid_order');
    }
    
    try {
      // Import Cashfree service
      const { getOrderStatusV2 } = await import("./services/cashfreeV2");
      
      // Verify payment status
      const orderStatus = await getOrderStatusV2(order_id as string);
      
      if (orderStatus.order_status === 'PAID') {
        // Find user by order ID
        const users = await storage.getAllUsers();
        const user = users.find(u => u.pending_payment_order_id === order_id);
        
        if (user) {
          // Update user subscription status
          const subscriptionExpiry = new Date();
          subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
          
          await storage.updateUser(user.id, {
            subscription_status: 'active',
            subscription_expires_at: subscriptionExpiry.toISOString(),
            payment_customer_id: orderStatus.customer_details?.customer_id || null,
            payment_subscription_id: order_id,
            pending_payment_order_id: null
          });
        }
        
        res.redirect('/subscribe?success=true');
      } else {
        res.redirect('/subscribe?error=payment_failed');
      }
    } catch (error) {
      console.error("Error processing payment return:", error);
      res.redirect('/subscribe?error=processing_failed');
    }
  });
  
  // Payment webhook handler
  app.post('/api/payment/webhook', async (req: any, res) => {
    try {
      const { data } = req.body;
      
      if (data?.order?.order_status === 'PAID') {
        const orderId = data.order.order_id;
        
        // Find user by order ID
        const users = await storage.getAllUsers();
        const user = users.find(u => u.pending_payment_order_id === orderId);
        
        if (user) {
          // Update user subscription status
          const subscriptionExpiry = new Date();
          subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
          
          await storage.updateUser(user.id, {
            subscription_status: 'active',
            subscription_expires_at: subscriptionExpiry.toISOString(),
            payment_customer_id: data.order.customer_details?.customer_id || null,
            payment_subscription_id: orderId,
            pending_payment_order_id: null
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Check subscription status
  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const user = req.user;
    
    const hasActiveSubscription = user.subscription_status === 'active' && 
                                 user.subscription_expires_at && 
                                 new Date(user.subscription_expires_at) > new Date();
    
    res.json({
      hasActiveSubscription,
      plan: hasActiveSubscription ? 'pro' : 'free',
      expiresAt: user.subscription_expires_at
    });
  });
  
  // Temporary subscription activation endpoint (bypasses payment for testing)
  app.post("/api/payment/activate-subscription", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const userId = req.user.id;
      
      // Update user subscription status
      await db.update(users)
        .set({
          subscription_status: 'active',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        })
        .where(eq(users.id, userId));
      
      console.log(`Subscription activated for user ${userId}`);
      
      return res.json({ 
        success: true, 
        message: 'Subscription activated successfully' 
      });
    } catch (error) {
      console.error('Error activating subscription:', error);
      return res.status(500).json({ error: 'Failed to activate subscription' });
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
      "https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=apify_api_9dhAJl3j2KT3Ew2l5Na8I8r0byW2Gn3QVX4g",
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
    
    const verificationUrl = 'https://api.apify.com/v2/acts/devil_port369-owner~email-verifier/run-sync-get-dataset-items?token=apify_api_9dhAJl3j2KT3Ew2l5Na8I8r0byW2Gn3QVX4g';
    
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
    const response = await fetch("https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/run-sync-get-dataset-items?token=apify_api_9dhAJl3j2KT3Ew2l5Na8I8r0byW2Gn3QVX4g", {
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
