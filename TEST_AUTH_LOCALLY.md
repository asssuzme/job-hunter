# Testing Authentication Locally

## After adding the localhost redirect URI:

1. **Wait 1-2 minutes** for Google to update
2. **Clear your browser cache** or use incognito mode
3. Go to http://localhost:5000
4. Click "Sign in with Google"

## Troubleshooting Tips:

### If still getting redirect_uri_mismatch:
- Double-check the URI is EXACTLY: `http://localhost:5000/api/auth/google/callback`
- Make sure you clicked SAVE in Google Console
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Check these common issues:
- ❌ https://localhost:5000/... (wrong - use http)
- ❌ http://localhost:3000/... (wrong port)
- ❌ http://localhost:5000/api/auth/google/callback/ (trailing slash)
- ✅ http://localhost:5000/api/auth/google/callback (correct!)

## Alternative Development Approach:

If you're still having issues, you can temporarily use ngrok:
1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 5000`
3. Add the ngrok URL to Google Console
4. Update passport-config.ts with the ngrok URL temporarily

But the localhost approach should work once you add the URI correctly!