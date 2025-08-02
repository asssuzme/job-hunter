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

// Simple function to redirect to server-side auth
export async function signInWithGoogle() {
  // Redirect to our server-side auth endpoint
  window.location.href = '/api/auth/google';
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