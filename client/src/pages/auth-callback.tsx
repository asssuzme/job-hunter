import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { GridLoader } from '@/components/ui/loading-animations';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          // Sync with backend once
          const response = await fetch('/api/auth/supabase/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            // Success! Verify the session is created before redirect
            // Add a small delay to ensure session is saved
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const authCheckResponse = await fetch('/api/auth/user', {
              credentials: 'include'
            });
            
            if (authCheckResponse.ok) {
              // Session verified, redirect
              window.location.href = '/';
            } else {
              console.error('Session not ready after sync, retrying...');
              // Session not ready yet, try again
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
            }
          } else {
            const error = await response.text();
            throw new Error(`Failed to sync session with backend: ${error}`);
          }
        } else {
          // No session, redirect to home
          setLocation('/');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => setLocation('/'), 2000);
      }
    };
    
    // Wait a bit for Supabase to process the URL tokens
    setTimeout(handleCallback, 500);
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <GridLoader className="mx-auto" />
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Completing sign in...
        </motion.p>
      </motion.div>
    </div>
  );
}