import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/providers/theme-provider";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Results from "@/pages/results";
import Applications from "@/pages/applications";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Subscribe from "@/pages/subscribe";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import RefundPolicy from "@/pages/refund-policy";
import Contact from "@/pages/contact";
import Sitemap from "@/pages/sitemap";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/pages/auth-callback";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Using Supabase auth handling

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-primary font-mono">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/search" component={Home} />
          <Route path="/applications" component={Applications} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/results/:requestId" component={Results} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
        </>
      )}
      {/* Auth callback route */}
      <Route path="/auth/callback" component={AuthCallback} />
      {/* Policy pages accessible to all */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/contact" component={Contact} />
      <Route path="/sitemap" component={Sitemap} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  useEffect(() => {
    // Check if we have a Supabase session and sync it with backend
    const syncSupabaseSession = async () => {
      // First check for tokens in URL hash (in case Supabase hasn't processed them yet)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('Found tokens in URL, setting Supabase session manually...');
        
        // Manually set the session from URL tokens
        const { data, error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (setError) {
          console.error('Error setting session:', setError);
          return;
        }
      }
      
      // Now get the session (either existing or just set)
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session check result:', { hasSession: !!session, error });
      
      if (session && !error) {
        console.log('Supabase session found, syncing with backend...');
        console.log('Session user:', session.user.email);
        
        // Check if backend already has this session
        const authCheck = await fetch('/api/auth/user', { credentials: 'include' });
        
        if (!authCheck.ok) {
          // Backend doesn't have the session, sync it
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
                accessToken: session.provider_token || accessToken,
                refreshToken: session.provider_refresh_token || refreshToken,
                userMetadata: session.user.user_metadata,
              }),
            });

            if (response.ok) {
              console.log('Backend session synced successfully');
              // Clear the URL hash before reloading
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.reload();
            } else {
              console.error('Failed to sync session:', await response.text());
            }
          } catch (err) {
            console.error('Error syncing session:', err);
          }
        }
      } else {
        console.log('No Supabase session found');
      }
    };
    
    // Initial sync check
    syncSupabaseSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        // Sync the new session with backend
        await syncSupabaseSession();
      } else if (event === 'SIGNED_OUT') {
        // Clear backend session
        await fetch('/api/auth/logout', { 
          method: 'POST', 
          credentials: 'include' 
        });
        window.location.reload();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
