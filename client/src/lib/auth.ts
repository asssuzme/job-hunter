// Direct Google OAuth authentication functions

// Sign in with Google
export async function signInWithGoogle() {
  // TEMPORARY: Use dev login in development to bypass Google OAuth issues
  const isDevelopment = window.location.hostname === 'localhost' || 
                       (window.location.hostname.includes('.replit.dev') && 
                        !window.location.hostname.includes('service-genie-ashutoshlathrep')) ||
                       window.location.hostname.includes('.repl.co');
  
  // Always use Google OAuth for production domains
  const isProduction = window.location.hostname === 'gigfloww.com' || 
                      window.location.hostname === 'www.gigfloww.com' ||
                      window.location.hostname === 'service-genie-ashutoshlathrep.replit.app';
  
  if (isDevelopment && !isProduction) {
    window.location.href = '/api/auth/dev-login';
  } else {
    window.location.href = '/api/auth/google';
  }
}

// Sign out function
export async function signOut() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    
    // Redirect to home page after logout
    window.location.href = '/';
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}