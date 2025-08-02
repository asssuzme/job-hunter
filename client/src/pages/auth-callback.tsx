import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple callback handler - Supabase will handle the tokens automatically
    console.log('Auth callback page loaded');
    
    // Give Supabase a moment to process the tokens
    const timer = setTimeout(() => {
      // Check if we have a session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setTimeout(() => setLocation('/'), 2000);
        } else if (session) {
          console.log('Session found, redirecting to home...');
          window.location.href = '/';
        } else {
          console.log('No session found, redirecting to home...');
          setLocation('/');
        }
      });
    }, 1000); // Wait 1 second for Supabase to process

    return () => clearTimeout(timer);
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