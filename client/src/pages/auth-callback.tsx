import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for tokens in URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Tokens can be in hash or query params depending on OAuth flow
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        
        console.log('Auth callback - tokens found:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          url: window.location.href 
        });
        
        if (accessToken && refreshToken) {
          // Manually set the session with the tokens
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (setSessionError) {
            throw setSessionError;
          }
          
          console.log('Session set successfully');
        }
        
        // Now get the session (either existing or just set)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          console.log('Session found, syncing with backend...');
          
          // Store the Google tokens in the backend
          const response = await fetch('/api/auth/supabase/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              accessToken: session.provider_token || accessToken,
              refreshToken: session.provider_refresh_token || refreshToken,
              userMetadata: session.user.user_metadata,
            }),
          });

          if (response.ok) {
            console.log('Backend sync successful, redirecting...');
            // Use replace instead of href to avoid adding to history
            window.location.replace('/');
          } else {
            const errorData = await response.text();
            throw new Error(`Failed to store auth session: ${errorData}`);
          }
        } else {
          // No session and no tokens - authentication failed
          throw new Error('No authentication tokens received');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        // Redirect to home after showing error
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-2">Authentication Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}