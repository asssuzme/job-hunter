import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { users, jobScrapingRequests, emailApplications, gmailCredentials, type User } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import OpenAI from "openai";
import multer from "multer";
import { google } from "googleapis";
import { MailService } from '@sendgrid/mail';
// import PDFParse from 'pdf-parse'; // Commenting out for now due to import issue

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
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
    
    res.json(user);
  });

  // Supabase OAuth callback
  app.post("/api/auth/supabase/callback", async (req, res) => {
    try {
      const { userId, email, userMetadata } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Upsert user
      const [user] = await db
        .insert(users)
        .values({
          id: userId,
          email: email,
          firstName: userMetadata?.first_name || userMetadata?.given_name || null,
          lastName: userMetadata?.last_name || userMetadata?.family_name || null,
          profileImageUrl: userMetadata?.avatar_url || userMetadata?.picture || null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: email,
            firstName: userMetadata?.first_name || userMetadata?.given_name || null,
            lastName: userMetadata?.last_name || userMetadata?.family_name || null,
            profileImageUrl: userMetadata?.avatar_url || userMetadata?.picture || null,
          },
        })
        .returning();
      
      // Set session
      req.session.userId = user.id;
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        res.json({ success: true, userId: user.id });
      });
    } catch (error) {
      console.error('Supabase callback error:', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true });
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

  app.get("/api/job-scraping/status/:requestId", requireAuth, async (req, res) => {
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
      error: request.errorMessage,
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