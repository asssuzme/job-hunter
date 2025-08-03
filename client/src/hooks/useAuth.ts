import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { getAuthToken, removeAuthToken } from "@/lib/auth-token";
import { useEffect } from "react";

export function useAuth() {
  const token = getAuthToken();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Don't fetch if no token
    enabled: !!token,
    // Prevent aggressive refetching on window focus
    refetchOnWindowFocus: false,
    // Keep auth data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache auth data for 10 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Clear token if we get a 401
  useEffect(() => {
    if (error && (error as any).message?.includes('401')) {
      removeAuthToken();
    }
  }, [error]);

  return {
    user,
    isLoading: token ? isLoading : false,
    isAuthenticated: !!user && !!token,
  };
}