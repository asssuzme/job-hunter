# Fix Supabase Redirect URL

The error occurs because Supabase is redirecting to the wrong URL after Google login. Here's how to fix it:

## UPDATE: The Code is Fixed!

I've updated the app to handle OAuth redirects properly. The app will now:
1. Detect when Supabase redirects to `localhost:5000/?code=...`
2. Automatically process the authentication
3. Save the session and redirect to the home page

## Steps to Configure Supabase:

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in the left sidebar
   - Click "URL Configuration"

3. **Update Redirect URLs** (Add ALL of these):
   ```
   http://localhost:5000
   http://localhost:5000/
   http://localhost:5000/auth/callback
   https://YOUR-APP-NAME.replit.app
   https://YOUR-APP-NAME.replit.app/
   https://YOUR-APP-NAME.replit.app/auth/callback
   ```
   - Replace YOUR-APP-NAME with your actual Replit app name

4. **Update Site URL** (Important!)
   - In the same page, find "Site URL"
   - Set it to: `http://localhost:5000`
   - This is where users will be redirected after authentication

5. **Save Changes**
   - Click "Save" at the bottom of the page

## Test the Fix:

1. **Clear your browser cache** or use an incognito window
2. Go to http://localhost:5000
3. Click "Sign in with Google"
4. Complete the Google login
5. You should be automatically redirected and logged in

## What Changed:

- App now detects OAuth callback parameters (`?code=...`) in the URL
- Automatically processes the authentication when these parameters are present
- Handles the redirect properly even when Supabase redirects to the root URL

## If Still Having Issues:

1. Check the browser console for any errors
2. Make sure all redirect URLs are added in Supabase
3. Ensure cookies are enabled in your browser
4. Try a different browser or incognito mode