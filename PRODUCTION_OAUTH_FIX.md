# Production OAuth "invalid_credentials" Fix

## Problem
Users get "invalid_credentials" error when trying to authorize Gmail sending on gigfloww.com.

## Root Cause
The Google OAuth 2.0 application configuration is missing required settings for the production domain.

## Solution Steps

### 1. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**

### 2. Find Your OAuth 2.0 Client
- Look for the OAuth 2.0 Client ID that matches your `GOOGLE_CLIENT_ID`
- Click the **pencil icon** to edit it

### 3. Add Required Authorized JavaScript Origins
In the "Authorized JavaScript origins" section, add:
```
https://gigfloww.com
http://localhost:5000
```

### 4. Add Required Authorized Redirect URIs  
In the "Authorized redirect URIs" section, add:
```
https://gigfloww.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

### 5. Verify OAuth Consent Screen
Go to **APIs & Services** → **OAuth consent screen**:
- **App name**: Set to "AutoApply.AI" or "GigFloww"
- **User support email**: Set to team@gigfloww.com
- **Developer contact information**: Set to team@gigfloww.com
- **Authorized domains**: Add `gigfloww.com`

### 6. Enable Required APIs
Go to **APIs & Services** → **Library** and enable:
- **Google+ API** (for profile info)
- **Gmail API** (for sending emails)

### 7. Test Configuration
Visit: `https://gigfloww.com/api/oauth-debug` to see current configuration.

## Common Issues

### Issue: "redirect_uri_mismatch"
- **Cause**: Missing redirect URI in OAuth configuration
- **Fix**: Add exact callback URL to "Authorized redirect URIs"

### Issue: "invalid_client"
- **Cause**: Wrong Client ID or Client Secret
- **Fix**: Verify environment variables match OAuth app

### Issue: "access_denied"
- **Cause**: User clicked "Cancel" or app not verified
- **Fix**: Complete OAuth consent screen verification

## Verification
After making changes:
1. Wait 5-10 minutes for Google to propagate changes
2. Test Gmail authorization flow on gigfloww.com
3. Check browser developer console for any errors
4. Use the diagnostic endpoint to verify configuration

## Temporary Workaround
If OAuth can't be fixed immediately, users can use the "Use Email App" button to send emails through their default email client.