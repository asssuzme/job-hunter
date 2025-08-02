import type { Express } from "express";

export function setupAuthDiagnostics(app: Express) {
  // Diagnostic endpoint to check OAuth configuration
  app.get("/api/auth/diagnostics", (req, res) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const diagnostics = {
      environment: process.env.NODE_ENV,
      baseUrl: baseUrl,
      configuredCallbackUrl: `${baseUrl}/api/auth/google/callback`,
      headers: {
        host: req.get('host'),
        'x-forwarded-proto': req.get('x-forwarded-proto'),
        'x-forwarded-host': req.get('x-forwarded-host'),
      },
      oauth: {
        clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
        clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
        secretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
      },
      replitEnv: {
        REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
        REPLIT_DEPLOYMENT_DOMAIN: process.env.REPLIT_DEPLOYMENT_DOMAIN,
        REPL_SLUG: process.env.REPL_SLUG,
        REPL_OWNER: process.env.REPL_OWNER,
      }
    };
    
    res.json(diagnostics);
  });
  
  // Test OAuth URL generation
  app.get("/api/auth/test-oauth-url", (req, res) => {
    // Handle production URL properly
    let baseUrl;
    if (process.env.NODE_ENV === 'production' || req.get('host')?.includes('replit.app')) {
      baseUrl = 'https://service-genie-ashutoshlathrep.replit.app';
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
      
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile https://www.googleapis.com/auth/gmail.send')}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    res.json({
      baseUrl,
      redirectUri,
      authUrl,
      instructions: "Copy the redirectUri above and add it to your Google OAuth app's authorized redirect URIs"
    });
  });
}