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

// Sign in with Google using Supabase
export async function signInWithGoogle() {
  // For development, ensure we use the correct port
  const origin = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : window.location.origin;
    
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) {
    throw error;
  }
  
  return data;
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