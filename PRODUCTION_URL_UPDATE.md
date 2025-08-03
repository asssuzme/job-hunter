# Production URL Configuration Update

## Changes Made

We're now using the Replit production URL exclusively:
**https://service-genie-ashutoshlathrep.replit.app**

### 1. Updated CORS Configuration
- Removed gigfloww.com from allowed origins
- Added Replit production URLs only

### 2. Updated Session Configuration
- Removed domain restriction (was set to .gigfloww.com)
- Sessions now work properly on Replit domain

### 3. Updated Gmail OAuth URLs
- Changed callback URLs to use Replit production URL
- No longer references gigfloww.com

## Required Supabase Updates

You need to update your Supabase redirect URLs to include:
- https://service-genie-ashutoshlathrep.replit.app/auth/callback
- http://localhost:5000/auth/callback
- http://localhost:3000/auth/callback

Remove any gigfloww.com URLs from Supabase.

## Google OAuth Updates

Update your Google OAuth authorized redirect URIs:
- https://service-genie-ashutoshlathrep.replit.app/api/auth/gmail/callback
- http://localhost:5000/api/auth/gmail/callback

## Testing

1. Clear your browser cookies
2. Try signing in at: https://service-genie-ashutoshlathrep.replit.app
3. The authentication should now work properly