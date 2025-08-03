import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { users, jobScrapingRequests, emailApplications, gmailCredentials, type User } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import OpenAI from "openai";
import multer from "multer";
import { google } from "googleapis";
import { MailService } from '@sendgrid/mail';
import passport from './passport-config';
// import PDFParse from 'pdf-parse'; // Commenting out for now due to import issue

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Add session data interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Simple auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.session.userId))
    .limit(1);
  
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // CORS configuration for production
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://service-genie-ashutoshlathrep.replit.app',
      'https://service-genie-ashutoshlathrep.repl.co',
      'http://localhost:5000',
      'http://localhost:3000'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // === AUTHENTICATION ROUTES ===
  
  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - User ID:', req.session.userId);
    
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);
      
      if (!user) {
        console.log('No user found for ID:', req.session.userId);
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log('User found:', user.email);
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Google OAuth login
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // TEMPORARY: Development bypass for testing
  app.get('/api/auth/dev-login', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).send('Not found');
    }
    
    // Create or get test user
    const testEmail = 'test@example.com';
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          id: 'dev-user-123',
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        })
        .returning();
    }
    
    req.session.userId = user.id;
    await new Promise<void>((resolve) => {
      req.session.save(() => resolve());
    });
    
    res.redirect('/');
  });

  // Google OAuth callback
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    async (req, res) => {
      try {
        // Successful authentication
        const user = req.user as any;
        if (!user || !user.id) {
          console.error('No user or user ID after authentication');
          return res.redirect('/?error=no_user');
        }
        
        req.session.userId = user.id;
        console.log('Setting session userId:', user.id);
        
        // Force session save and wait for it
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              reject(err);
            } else {
              console.log('Session saved successfully');
              resolve();
            }
          });
        });
        
        // Add a small delay to ensure session is propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to frontend
        res.redirect('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        res.redirect('/?error=session_error');
      }
    }
  );

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to destroy session' });
        }
        res.json({ success: true });
      });
    });
  });

  // === GMAIL ROUTES ===
  
  // Gmail OAuth authorization
  app.get("/api/auth/gmail/authorize", requireAuth, (req, res) => {
    // Determine the base URL based on the environment
    let baseUrl: string;
    if (process.env.REPL_SLUG) {
      // In production on Replit
      baseUrl = 'https://service-genie-ashutoshlathrep.replit.app';
    } else {
      // In development, use the protocol and host
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/gmail/callback`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.send'],
      state: JSON.stringify({ userId: req.user!.id }),
      prompt: 'consent',
    });

    res.json({ authUrl });
  });

  // Gmail OAuth callback
  app.get("/api/auth/gmail/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect('/settings?gmail=error');
    }

    const { userId } = JSON.parse(state as string);

    // Determine the base URL based on the environment
    let baseUrl: string;
    if (process.env.REPL_SLUG) {
      baseUrl = 'https://service-genie-ashutoshlathrep.replit.app';
    } else {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/gmail/callback`
    );

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      await db
        .insert(gmailCredentials)
        .values({
          userId,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token!,
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
          isActive: true,
        })
        .onConflictDoUpdate({
          target: gmailCredentials.userId,
          set: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token || sql`${gmailCredentials.refreshToken}`,
            expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
            isActive: true,
          },
        });

      res.redirect('/settings?gmail=success');
    } catch (error) {
      console.error('Gmail callback error:', error);
      res.redirect('/settings?gmail=error');
    }
  });

  // Gmail status
  app.get("/api/auth/gmail/status", requireAuth, async (req, res) => {
    const [creds] = await db
      .select()
      .from(gmailCredentials)
      .where(eq(gmailCredentials.userId, req.user!.id))
      .limit(1);

    const isConnected = creds && creds.isActive && creds.expiresAt > new Date();
    res.json({ isConnected });
  });

  // Unlink Gmail
  app.post("/api/auth/gmail/unlink", requireAuth, async (req, res) => {
    await db
      .update(gmailCredentials)
      .set({ isActive: false })
      .where(eq(gmailCredentials.userId, req.user!.id));

    res.json({ success: true });
  });

  // === DASHBOARD ROUTES ===
  
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    // Get total counts
    const [scrapingCount] = await db
      .select({ count: sql`count(*)::int` })
      .from(jobScrapingRequests)
      .where(eq(jobScrapingRequests.userId, req.user!.id));

    const [applicationCount] = await db
      .select({ count: sql`count(*)::int` })
      .from(emailApplications)
      .where(eq(emailApplications.userId, req.user!.id));

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentScrapingCount] = await db
      .select({ count: sql`count(*)::int` })
      .from(jobScrapingRequests)
      .where(
        and(
          eq(jobScrapingRequests.userId, req.user!.id),
          gte(jobScrapingRequests.createdAt, sevenDaysAgo)
        )
      );

    res.json({
      totalJobsScraped: scrapingCount?.count || 0,
      totalApplicationsSent: applicationCount?.count || 0,
      activeJobSearches: recentScrapingCount?.count || 0,
      pendingApplications: 0,
    });
  });

  // === JOB SCRAPING ROUTES ===
  
  // Scrape job endpoint
  app.post("/api/scrape-job", requireAuth, async (req, res) => {
    const { linkedinUrl, resumeText } = req.body;
    
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }

    // Create job scraping request
    const [request] = await db
      .insert(jobScrapingRequests)
      .values({
        userId: req.user!.id,
        linkedinUrl,
        resumeText,
        status: 'pending',
      })
      .returning();

    // For now, simulate processing by marking as completed after a delay
    setTimeout(async () => {
      await db
        .update(jobScrapingRequests)
        .set({ 
          status: 'completed',
          results: { 
            message: 'Job scraping completed successfully!',
            jobsFound: 5,
            enrichedResults: {
              totalCount: 5,
              canApplyCount: 3
            }
          },
          completedAt: new Date()
        })
        .where(eq(jobScrapingRequests.id, request.id));
    }, 2000);
    
    res.json({ requestId: request.id });
  });

  // Get scraping status
  app.get("/api/scrape-job/status/:requestId", requireAuth, async (req, res) => {
    const { requestId } = req.params;
    
    const [request] = await db
      .select()
      .from(jobScrapingRequests)
      .where(
        and(
          eq(jobScrapingRequests.id, requestId),
          eq(jobScrapingRequests.userId, req.user!.id)
        )
      )
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({
      id: request.id,
      status: request.status,
      results: request.results,
      enrichedResults: request.results?.enrichedResults || null,
      error: request.errorMessage,
    });
  });
  
  // Generate LinkedIn URL from search parameters
  app.post("/api/generate-linkedin-url", requireAuth, async (req, res) => {
    const { keyword, location, workType } = req.body;
    
    if (!keyword || !location || !workType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      // Simple LinkedIn URL generation
      const baseUrl = 'https://www.linkedin.com/jobs/search';
      const params = new URLSearchParams({
        keywords: keyword,
        location: location,
        f_WT: workType // 1=Onsite, 2=Remote, 3=Hybrid
      });
      
      const linkedinUrl = `${baseUrl}?${params.toString()}`;
      
      res.json({ 
        linkedinUrl,
        message: `Generated LinkedIn search URL for ${keyword} in ${location}`
      });
    } catch (error) {
      console.error('Error generating LinkedIn URL:', error);
      res.status(500).json({ error: 'Failed to generate LinkedIn URL' });
    }
  });
  
  app.post("/api/job-scraping/submit", requireAuth, async (req, res) => {
    const { search, location } = req.body;
    
    const [request] = await db
      .insert(jobScrapingRequests)
      .values({
        userId: req.user!.id,
        linkedinUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(search)}&location=${encodeURIComponent(location)}`,
        status: 'pending',
        results: [],
      })
      .returning();

    res.json({
      requestId: request.id,
      status: 'pending',
      message: 'Job scraping request submitted',
    });
  });



  // === EMAIL ROUTES ===
  
  app.post("/api/email/generate", requireAuth, async (req, res) => {
    const { jobTitle, companyName, jobDescription, resume } = req.body;
    
    const prompt = `Generate a professional email applying for the ${jobTitle} position at ${companyName}.

Job Description:
${jobDescription}

Resume:
${resume}

Create a compelling, personalized email that:
1. Shows genuine interest in the specific role and company
2. Highlights relevant experience and skills from the resume
3. Is concise (under 250 words)
4. Has a professional tone

Format the email with proper greeting and sign-off.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional career coach helping job seekers write compelling application emails."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const emailContent = completion.choices[0]?.message?.content || '';
      res.json({
        email: emailContent,
        subject: `Application for ${jobTitle} position at ${companyName}`,
      });
    } catch (error) {
      console.error('Email generation error:', error);
      res.status(500).json({ error: 'Failed to generate email' });
    }
  });

  app.post("/api/email/send", requireAuth, async (req, res) => {
    const { to, subject, body, jobTitle, companyName, useGmail } = req.body;
    
    try {
      if (useGmail) {
        // Send with Gmail
        const [creds] = await db
          .select()
          .from(gmailCredentials)
          .where(eq(gmailCredentials.userId, req.user!.id))
          .limit(1);

        if (!creds || !creds.isActive) {
          return res.status(400).json({ error: 'Gmail not connected' });
        }

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
          access_token: creds.accessToken,
          refresh_token: creds.refreshToken,
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const message = [
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `To: ${to}`,
          `Subject: ${subject}`,
          '',
          body.replace(/\n/g, '<br>'),
        ].join('\n');

        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });
      } else {
        // Send with SendGrid
        await mailService.send({
          to,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@autoapply.ai',
          subject,
          html: body.replace(/\n/g, '<br>'),
        });
      }

      // Record the email
      await db.insert(emailApplications).values({
        userId: req.user!.id,
        jobTitle: jobTitle || 'Unknown Position',
        companyName: companyName || 'Unknown Company',
        companyEmail: to,
        emailSubject: subject,
        emailBody: body,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // === RESUME ROUTES ===
  
  app.post("/api/resume/upload", requireAuth, upload.single('resume'), async (req, res) => {
    let resumeText = '';
    
    if (req.file) {
      // PDF upload - for now just return error
      return res.status(400).json({ error: 'PDF upload temporarily disabled. Please use text format.' });
    } else if (req.body.resumeText) {
      // Text upload
      resumeText = req.body.resumeText;
    }

    if (!resumeText) {
      return res.status(400).json({ error: 'No resume content provided' });
    }

    await db
      .update(users)
      .set({ resumeText })
      .where(eq(users.id, req.user!.id));

    res.json({ success: true });
  });

  // === APPLICATION ROUTES ===
  
  app.get("/api/applications", requireAuth, async (req, res) => {
    const applications = await db
      .select()
      .from(emailApplications)
      .where(eq(emailApplications.userId, req.user!.id))
      .orderBy(desc(emailApplications.sentAt));

    res.json(applications);
  });

  const httpServer = createServer(app);
  return httpServer;
}