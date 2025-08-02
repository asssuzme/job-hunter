import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend Request type to include session
declare module "express-session" {
  interface SessionData {
    userId?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }
}

interface AuthRequest extends Request {
  user?: User;
}

export function setupSupabaseAuth(app: Express) {
  // Middleware to check if user is authenticated
  app.use(async (req: AuthRequest, res, next) => {
    if (req.session?.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    next();
  });

  // Handle Supabase authentication callback
  app.post('/api/auth/supabase/callback', async (req: AuthRequest, res: Response) => {
    try {
      const { userId, email, accessToken, refreshToken, userMetadata } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Upsert user in our database
      await storage.upsertUser({
        id: userId,
        email: email,
        firstName: userMetadata?.first_name || userMetadata?.given_name || null,
        lastName: userMetadata?.last_name || userMetadata?.family_name || null,
        profileImageUrl: userMetadata?.avatar_url || userMetadata?.picture || null,
      });

      // Store session data
      req.session.userId = userId;
      req.session.googleAccessToken = accessToken;
      req.session.googleRefreshToken = refreshToken;

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Error in Supabase callback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json(req.user);
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: AuthRequest, res: Response) => {
    req.session.destroy((err) => {
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
export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};