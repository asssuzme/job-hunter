# Fix Supabase Redirect URL

The error occurs because Supabase is redirecting to the wrong URL after Google login. Here's how to fix it:

## Steps to Fix:

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in the left sidebar
   - Click "URL Configuration"

3. **Update Redirect URLs**
   - Find the "Redirect URLs" section
   - Add these URLs (remove any existing incorrect ones):
   ```
   http://localhost:5000/auth/callback
   https://YOUR-APP-NAME.replit.app/auth/callback
   ```
   - Replace YOUR-APP-NAME with your actual Replit app name

4. **Update Site URL** (Important!)
   - In the same page, find "Site URL"
   - Set it to: `http://localhost:5000`
   - This is where users will be redirected after authentication

5. **Save Changes**
   - Click "Save" at the bottom of the page

## Why This Happens:

- Supabase needs to know where to redirect users after authentication
- The current redirect is going to `localhost:5000/?code=...` which Safari can't handle
- We need it to go to `localhost:5000/auth/callback` where our app can process the login

## After Making These Changes:

1. Try logging in again with Google
2. You should be redirected to the callback page and then to the app home page
3. The authentication should complete successfully

## Note:
- Make sure you're using `http://` for localhost (not `https://`)
- The callback URL must match exactly what's in the code