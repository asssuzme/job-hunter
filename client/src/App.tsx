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
    // Handle Supabase auth callback when tokens are in URL fragment
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log('Processing Supabase auth callback...');
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          // Store the session in backend
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
              // Clear the URL hash and reload
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.reload();
            } else {
              console.error('Failed to store auth session');
            }
          } catch (err) {
            console.error('Error processing auth callback:', err);
          }
        }
      }
    };

    handleAuthCallback();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        // User signed in, reload to update UI
        setTimeout(() => {
          window.location.reload();
        }, 100);
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
