import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Activity, 
  Database, 
  Search, 
  Mail, 
  TrendingUp,
  Loader2,
  Plus,
  Eye,
  Calendar,
  Send,
  CheckCircle,
  Users,
  Clock,
  ArrowUpRight,
  Sparkles,
  Briefcase,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCardSkeleton, Spinner } from "@/components/ui/loading-animations";
import { Badge } from "@/components/ui/badge";
import { JobScraper } from "@/components/job-scraper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";
import type { JobScrapingRequest } from "@shared/schema";

interface DashboardStats {
  totalJobsScraped: number;
  totalApplicationsSent: number;
  recentSearches: JobScrapingRequest[];
}





export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showNewSearch, setShowNewSearch] = useState(false);
  
  // Handle Gmail OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gmailAuth = urlParams.get('gmail_auth');
    const error = urlParams.get('error');
    
    if (gmailAuth === 'success') {
      toast({
        title: "Gmail connected successfully!",
        description: "You can now send emails directly from your Gmail account.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Invalidate Gmail status query
      queryClient.invalidateQueries({ queryKey: ['/api/auth/gmail/status'] });
    } else if (error === 'gmail_auth_failed') {
      toast({
        title: "Gmail authorization failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  // Logout function
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      // Logout error handled silently
    }
  };

  if (!user) {
    return null;
  }

  // Use statistics from backend - no need to recalculate
  


  return (
    <DashboardLayout user={user} onLogout={handleLogout} title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Welcome section */}
        <div className="glass-card p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-bold mb-2">
                Welcome back, {user && typeof user === 'object' && 'firstName' in user && user.firstName ? user.firstName : "User"}! 👋
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Ready to find your next opportunity? Let's get started.
              </p>
            </div>
            <Button
              onClick={() => setShowNewSearch(true)}
              className="btn-primary w-full md:w-auto h-12 text-base"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Job Search
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Total Jobs Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="inline-flex p-3 rounded-xl bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Total
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">
                {statsLoading ? (
                  <Spinner className="mx-0" />
                ) : (
                  (stats?.totalJobsScraped || 0).toLocaleString()
                )}
              </p>
              <p className="text-sm text-muted-foreground">Jobs Analyzed</p>
            </div>
            {(stats?.totalJobsScraped || 0) > 0 && (
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>From {stats?.recentSearches?.filter(s => s.status === 'completed').length || 0} searches</span>
              </div>
            )}
          </motion.div>

          {/* Applications Sent Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="inline-flex p-3 rounded-xl bg-accent/10">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="secondary" className="text-xs">
                <Send className="h-3 w-3 mr-1" />
                Sent
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">
                {statsLoading ? (
                  <Spinner className="mx-0" />
                ) : (
                  stats?.totalApplicationsSent || 0
                )}
              </p>
              <p className="text-sm text-muted-foreground">Applications Sent</p>
            </div>
            {(stats?.totalApplicationsSent || 0) > 0 && (
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>Total applications sent</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Searches Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Recent Searches</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {stats?.recentSearches?.length || 0} total
            </Badge>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          ) : stats?.recentSearches && stats.recentSearches.length > 0 ? (
            <div className="space-y-4">
              {stats.recentSearches.map((search, index) => (
                <motion.div
                  key={search.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  className="glass-card p-4 cursor-pointer group"
                  onClick={() => setLocation(`/results/${search.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={
                            search.status === 'completed' ? 'default' :
                            search.status === 'failed' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {search.status}
                        </Badge>
                        <span className="text-sm font-medium">
                          Search #{search.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(search.createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {search.linkedinUrl}
                      </p>
                      {search.status === 'completed' && search.enrichedResults ? (
                        (() => {
                          const enrichedResults = search.enrichedResults as any;
                          // Use stored fake total or generate consistent one for old searches
                          let fakeTotalJobs = enrichedResults.fakeTotalJobs;
                          if (!fakeTotalJobs) {
                            // For old searches, generate consistent number based on search ID
                            let hash = 0;
                            for (let i = 0; i < search.id.length; i++) {
                              hash = ((hash << 5) - hash) + search.id.charCodeAt(i);
                              hash = hash & hash;
                            }
                            fakeTotalJobs = 500 + Math.abs(hash % 1501); // 500-2000
                          }
                          const freeJobs = enrichedResults.freeJobs || enrichedResults.canApplyCount || 0;
                          const lockedJobs = enrichedResults.lockedJobs || (fakeTotalJobs - freeJobs);
                          return (
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1 text-xs">
                                <Briefcase className="h-3 w-3" />
                                <span>{fakeTotalJobs.toLocaleString()} jobs</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Users className="h-3 w-3" />
                                <span>{freeJobs} with contacts</span>
                              </div>
                              {lockedJobs > 0 && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <Lock className="h-3 w-3" />
                                  <span>{lockedJobs} locked</span>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No searches yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start your first job search to see your history here
              </p>
              <Button onClick={() => setShowNewSearch(true)} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Start First Search
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* New Search Dialog */}
      <Dialog open={showNewSearch} onOpenChange={setShowNewSearch}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Start New Job Search
            </DialogTitle>
          </DialogHeader>
          <JobScraper onComplete={(requestId) => {
            setShowNewSearch(false);
            setTimeout(() => {
              setLocation(`/results/${requestId}`);
            }, 500);
          }} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}