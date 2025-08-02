import { OAuth2Client } from 'google-auth-library';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: User;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}

// Get the correct base URL based on environment
const getBaseUrl = () => {
  if (process.env.REPLIT_DOMAINS) {
    // In production, use the first Replit domain
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  return 'http://localhost:5000';
};

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${getBaseUrl()}/api/auth/google/callback`
);

export function setupDirectGoogleAuth(app: Express) {
  // Middleware to check if user is authenticated
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (authReq.session?.userId) {
      try {
        const user = await storage.getUser(authReq.session.userId);
        if (user) {
          authReq.user = user;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    next();
  });

  // Start Google OAuth flow
  app.get('/api/auth/google', (req: Request, res: Response) => {
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.send',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: true,
    });

    res.redirect(authUrl);
  });

  // Handle Google OAuth callback
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getTokens(code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Failed to get user payload from Google');
      }

      // Upsert user in our database
      const user = await storage.upsertUser({
        id: payload.sub,
        email: payload.email || '',
        firstName: payload.given_name || null,
        lastName: payload.family_name || null,
        profileImageUrl: payload.picture || null,
      });

      // Store session data
      authReq.session.userId = user.id;
      authReq.session.googleAccessToken = tokens.access_token;
      authReq.session.googleRefreshToken = tokens.refresh_token;

      // Save session
      authReq.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        // Redirect to home page
        res.redirect('/');
      });
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json(authReq.user);
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    authReq.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
}

// Middleware to protect routes
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};