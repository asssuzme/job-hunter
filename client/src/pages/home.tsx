import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Activity, 
  Database, 
  Search, 
  Mail, 
  TrendingUp,
  Terminal,
  History,
  Loader2,
  Plus,
  Eye,
  Network,
  Binary,
  Cpu,
  BarChart3,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/job-form";
import { JobScraper } from "@/components/job-scraper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [showNewSearch, setShowNewSearch] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/logout", { method: "GET" }),
    onSuccess: () => {
      window.location.href = "/";
    }
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Tech Header */}
      <header className="tech-glass border-b border-primary/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-primary animate-pulse" />
              <div>
                <h1 className="text-2xl font-bold gradient-text">NEXUS JOB HUNTER</h1>
                <p className="text-xs text-primary/60 font-mono">AGENT ID: {user.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-primary">SYSTEM ACTIVE</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {user.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || "User"} 
                    className="h-8 w-8 rounded-full border-2 border-primary/50"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                </div>
              </div>
              
              <button
                onClick={() => logoutMutation.mutate()}
                className="tech-btn px-4 py-2 text-sm"
              >
                <Terminal className="h-4 w-4 mr-2 inline-block" />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="tech-card p-6 relative overflow-hidden scanner">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded bg-primary/10">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-primary/60 font-mono">STAT_01</span>
            </div>
            <h3 className="text-3xl font-bold text-primary font-mono">
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.totalJobsScraped || 0
              )}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">TOTAL JOBS ANALYZED</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
              <div className="h-full bg-primary processing-bar"></div>
            </div>
          </div>

          <div className="tech-card p-6 relative overflow-hidden scanner">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-primary/60 font-mono">STAT_02</span>
            </div>
            <h3 className="text-3xl font-bold text-primary font-mono">
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats?.totalApplicationsSent || 0
              )}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">APPLICATIONS TRANSMITTED</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
              <div className="h-full bg-primary processing-bar"></div>
            </div>
          </div>

          <div className="tech-card p-6 relative overflow-hidden scanner">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded bg-primary/10">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-primary/60 font-mono">STAT_03</span>
            </div>
            <h3 className="text-3xl font-bold text-primary font-mono">
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                `${((stats?.totalApplicationsSent || 0) / Math.max(stats?.totalJobsScraped || 1, 1) * 100).toFixed(1)}%`
              )}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">SUCCESS RATE</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
              <div className="h-full bg-primary processing-bar"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Network className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">MISSION CONTROL</h2>
          </div>
          
          <Dialog open={showNewSearch} onOpenChange={setShowNewSearch}>
            <DialogTrigger asChild>
              <button className="tech-btn group">
                <Plus className="h-4 w-4 mr-2" />
                INITIALIZE NEW SCAN
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl tech-glass border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold gradient-text flex items-center space-x-2">
                  <Cpu className="h-6 w-6" />
                  <span>NEW JOB SCAN PROTOCOL</span>
                </DialogTitle>
              </DialogHeader>
              <JobScraper />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search History */}
        <div className="tech-card p-6">
          <div className="flex items-center space-x-2 mb-6">
            <History className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold text-primary">SCAN HISTORY</h3>
            <div className="flex-1 h-px bg-primary/20"></div>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          ) : stats?.recentSearches && stats.recentSearches.length > 0 ? (
            <div className="space-y-4">
              {stats.recentSearches.map((search) => (
                <div 
                  key={search.id} 
                  className="tech-glass p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => setSelectedSearch(search.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <Search className="h-5 w-5 text-primary" />
                      <span className="text-sm font-mono text-primary">
                        SCAN_{search.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-mono ${
                        search.status === 'completed' ? 'bg-primary/20 text-primary' :
                        search.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {search.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {search.linkedinUrl}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(search.createdAt), 'MMM dd, HH:mm')}</span>
                      </span>
                      {search.status === 'completed' && search.filteredResults && (
                        <>
                          <span className="flex items-center space-x-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>{(search.filteredResults as any).totalCount || 0} TARGETS</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Binary className="h-3 w-3" />
                            <span>{(search.filteredResults as any).canApplyCount || 0} VIABLE</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button className="tech-btn px-4 py-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4 mr-2" />
                    VIEW
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-primary/20 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground font-mono">NO SCAN DATA AVAILABLE</p>
              <p className="text-sm text-muted-foreground mt-2">Initialize your first job scan to begin tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Search View */}
      {selectedSearch && (
        <Dialog open={!!selectedSearch} onOpenChange={() => setSelectedSearch(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto tech-glass border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text">
                SCAN RESULTS: {selectedSearch.slice(0, 8).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            {/* Here you would show the detailed results */}
            <div className="text-center py-8">
              <p className="text-muted-foreground">Detailed scan results view coming soon...</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}