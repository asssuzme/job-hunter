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
  // In Replit development environment
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  // In production with Replit domains
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  // In production with app domain
  if (process.env.REPLIT_APP_DOMAIN) {
    return `https://${process.env.REPLIT_APP_DOMAIN}`;
  }
  // Local development
  return 'http://localhost:5000';
};

// Create OAuth2Client dynamically to handle different environments
const createOAuth2Client = (req?: Request) => {
  let baseUrl = getBaseUrl();
  
  // If request is provided, use the actual host
  if (req) {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    baseUrl = `${protocol}://${host}`;
  }
  
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`
  );
};

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
    const oauth2Client = createOAuth2Client(req);
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

    // Log the redirect URI being used
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    console.log('OAuth redirect URI:', redirectUri);

    res.redirect(authUrl);
  });

  // Handle Google OAuth callback
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { code, error } = req.query;

    // Log callback details
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    console.log('OAuth callback - URL:', `${protocol}://${host}${req.url}`);
    console.log('OAuth callback - Code present:', !!code);
    console.log('OAuth callback - Error:', error);

    if (error) {
      console.error('OAuth error from Google:', error);
      return res.redirect('/?error=' + encodeURIComponent(error as string));
    }

    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    try {
      const oauth2Client = createOAuth2Client(req);
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code as string);
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