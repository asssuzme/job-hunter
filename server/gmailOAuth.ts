import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

// Gmail-specific OAuth configuration
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

// Create OAuth client for Gmail
export function createGmailOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  return new OAuth2Client(
    clientId,
    clientSecret,
    `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/gmail/callback`
  );
}

// Generate Gmail authorization URL
export function getGmailAuthUrl(userId: string): string {
  const oauth2Client = createGmailOAuthClient();
  
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
export async function handleGmailCallback(code: string, state: string) {
  try {
    const oauth2Client = createGmailOAuthClient();
    
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