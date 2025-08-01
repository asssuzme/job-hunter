import { useState } from "react";
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
  BarChart3,
  Calendar,
  Send,
  CheckCircle,
  Target,
  Users,
  Clock,
  ArrowUpRight,
  Sparkles,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Animated progress ring component
function ProgressRing({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-primary"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showNewSearch, setShowNewSearch] = useState(false);

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/auth/logout", { method: "GET" }),
    onSuccess: () => {
      window.location.href = "/";
    }
  });

  if (!user) {
    return null;
  }

  const successRate = stats ? Math.round((stats.totalApplicationsSent / Math.max(stats.totalJobsScraped, 1)) * 100) : 0;

  return (
    <DashboardLayout user={user} onLogout={() => logoutMutation.mutate()} title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Welcome section */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.firstName || "User"}! 👋
              </h1>
              <p className="text-muted-foreground">
                Ready to find your next opportunity? Let's get started.
              </p>
            </div>
            <Button
              onClick={() => setShowNewSearch(true)}
              className="btn-primary"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Job Search
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Jobs Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
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
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  stats?.totalJobsScraped || 0
                )}
              </p>
              <p className="text-sm text-muted-foreground">Jobs Analyzed</p>
            </div>
            <div className="mt-4 flex items-center text-sm text-primary">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last week</span>
            </div>
          </motion.div>

          {/* Applications Sent Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
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
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  stats?.totalApplicationsSent || 0
                )}
              </p>
              <p className="text-sm text-muted-foreground">Applications Sent</p>
            </div>
            <div className="mt-4 flex items-center text-sm text-accent">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>8 sent this week</span>
            </div>
          </motion.div>

          {/* Success Rate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex p-3 rounded-xl bg-green-500/10">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <Badge variant="secondary" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Rate
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-3xl font-bold">{successRate}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <ProgressRing percentage={successRate} size={80} />
            </div>
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
                      {search.status === 'completed' && search.filteredResults && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Briefcase className="h-3 w-3" />
                            <span>{(search.filteredResults as any).totalCount || 0} jobs</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Users className="h-3 w-3" />
                            <span>{(search.filteredResults as any).canApplyCount || 0} with contacts</span>
                          </div>
                        </div>
                      )}
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
        <DialogContent className="max-w-4xl">
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