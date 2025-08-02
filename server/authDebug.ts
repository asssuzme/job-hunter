import type { Express } from 'express';

export function setupAuthDebug(app: Express) {
  // Debug endpoint to show current OAuth configuration
  app.get('/api/auth/debug', (req, res) => {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const currentUrl = `${protocol}://${host}`;
    
    const info = {
      currentUrl,
      redirectUri: `${currentUrl}/api/auth/google/callback`,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
        REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
        REPLIT_APP_DOMAIN: process.env.REPLIT_APP_DOMAIN,
      },
      hasGoogleCredentials: {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      }
    };
    
    res.json(info);
  });
}