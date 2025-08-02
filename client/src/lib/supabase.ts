import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit', // Use implicit flow to get tokens immediately
    },
  }
);

// Helper function to sign in with Google using popup to avoid redirect issues
export async function signInWithGoogle() {
  try {
    // First, sign out any existing session to ensure clean state
    await supabase.auth.signOut();
    
    // Create a popup window for authentication
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/gmail.send',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: true, // This prevents the redirect
      },
    });
    
    if (error) throw error;
    
    // Open the auth URL in a popup
    const popup = window.open(
      data.url,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Return a promise that resolves when authentication is complete
    return new Promise((resolve, reject) => {
      // Check if popup is closed
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          // Check if we got a session
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              resolve({ session });
            } else {
              reject(new Error('Authentication cancelled'));
            }
          });
        }
      }, 1000);
      
      // Also listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          clearInterval(checkPopup);
          if (popup && !popup.closed) {
            popup.close();
          }
          authListener.subscription.unsubscribe();
          resolve({ session });
        }
      });
    });
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Helper function to get current user with Gmail tokens
export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  // The provider_token contains the Google OAuth access token
  return {
    user: session.user,
    accessToken: session.provider_token,
    refreshToken: session.provider_refresh_token,
  };
}

// Sign out function
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}