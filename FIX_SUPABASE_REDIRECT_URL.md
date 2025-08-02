# Fix Supabase Redirect URL - IMPORTANT UPDATE

## The Issue
Supabase is redirecting to `localhost:3000` instead of `localhost:5000` where your app runs.

## IMMEDIATE FIX REQUIRED

### 1. Update Supabase Dashboard Settings

**Go to Supabase Dashboard:**
1. Visit https://supabase.com/dashboard
2. Select your project
3. Click **"Authentication"** → **"URL Configuration"**

### 2. Update ALL URLs to Port 5000

**Site URL:** (CRITICAL - This is causing the issue!)
```
http://localhost:5000
```

**Redirect URLs:** (Add all of these)
```
http://localhost:5000
http://localhost:5000/
https://YOUR-REPLIT-USERNAME-YOUR-PROJECT-NAME.replit.app
https://YOUR-REPLIT-USERNAME-YOUR-PROJECT-NAME.replit.app/
```

Replace YOUR-REPLIT-USERNAME and YOUR-PROJECT-NAME with your actual values.

### 3. REMOVE any URLs with Port 3000
- Delete any URLs containing `:3000`
- These are causing the redirect issue

### 4. Save Changes
- Click **"Save"** at the bottom

## After Updating:

1. **Clear browser data** for localhost
2. Close all browser tabs with localhost
3. Open a new tab and go to `http://localhost:5000`
4. Try signing in again

## Why This Happens:
- Supabase defaults to port 3000 (common for React apps)
- Your app runs on port 5000
- The Site URL setting controls where users are redirected after authentication

## Code Updates Applied:
- App now handles authentication directly on the main page
- No separate callback route needed
- Automatically processes OAuth tokens when detected