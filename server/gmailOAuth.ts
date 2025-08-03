import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

// Gmail-specific OAuth configuration
// Only request the minimum required scope for sending emails
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send'  // Only permission to send emails
];

// Create OAuth client for Gmail
export function createGmailOAuthClient(req?: any) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  // Determine redirect URL based on environment
  let redirectUrl;
  if (req && req.hostname) {
    // Use request hostname for dynamic redirect
    const protocol = req.secure || req.hostname.includes('gigfloww.com') ? 'https' : 'http';
    redirectUrl = `${protocol}://${req.hostname}/api/auth/gmail/callback`;
  } else {
    // Fallback to environment-based URL
    const isProduction = process.env.NODE_ENV === 'production' || 
      process.env.REPLIT_DOMAINS?.includes('gigfloww.com');
    redirectUrl = isProduction 
      ? 'https://gigfloww.com/api/auth/gmail/callback'
      : `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/gmail/callback`;
  }

  return new OAuth2Client(
    clientId,
    clientSecret,
    redirectUrl
  );
}

// Generate Gmail authorization URL
export function getGmailAuthUrl(userId: string, req?: any): string {
  const oauth2Client = createGmailOAuthClient(req);
  
  // Create state parameter with user ID
  const state = Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  })).toString('base64');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state,
    prompt: 'consent' // Force consent screen to ensure we get refresh token
  });
}

// Handle Gmail OAuth callback
export async function handleGmailCallback(code: string, state: string, req?: any) {
  try {
    const oauth2Client = createGmailOAuthClient(req);
    
    // Decode and validate state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      userId: stateData.userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date
    };
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    throw error;
  }
}

// Refresh Gmail access token
export async function refreshGmailToken(refreshToken: string): Promise<string | null> {
  try {
    const oauth2Client = createGmailOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token || null;
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    return null;
  }
}