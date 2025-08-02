import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Store the Google tokens in the backend
        try {
          const response = await fetch('/api/auth/supabase/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              accessToken: session.provider_token,
              refreshToken: session.provider_refresh_token,
              userMetadata: session.user.user_metadata,
            }),
          });

          if (response.ok) {
            // Redirect to home page after successful login
            setLocation('/');
          } else {
            console.error('Failed to store auth session');
            setLocation('/');
          }
        } catch (error) {
          console.error('Error storing auth session:', error);
          setLocation('/');
        }
      }
    });
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}