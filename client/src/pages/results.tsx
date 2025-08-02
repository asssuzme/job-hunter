import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FilteredJobCard } from "@/components/filtered-job-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Activity, 
  CheckCircle, 
  XCircle,
  Loader2,
  ArrowLeft,
  Search,
  Users,
  Briefcase,
  Mail,
  Sparkles,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";

interface EnrichedJob {
  canApply: boolean;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  [key: string]: any;
}

interface ScrapingResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  enrichedResults?: {
    jobs: EnrichedJob[];
  };
  errorMessage?: string;
}

export default function Results() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const [userResume, setUserResume] = useState<string | null>(null);
  const [showProPlanModal, setShowProPlanModal] = useState(false);
  const [activeTab, setActiveTab] = useState("with-contacts");
  
  const { data: scrapingResult, isLoading } = useQuery<ScrapingResult>({
    queryKey: ['/api/scrape-job', requestId],
    enabled: !!requestId,
  });

  // Load user's saved resume when component mounts
  useEffect(() => {
    const loadUserResume = async () => {
      try {
        const response = await fetch('/api/user/resume');
        if (response.ok) {
          const data = await response.json();
          if (data.hasResume && data.resumeText) {
            setUserResume(data.resumeText);
          }
        }
      } catch (error) {
        console.error("Error loading user resume:", error);
      }
    };

    loadUserResume();
  }, []);

  if (!user) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout user={user} onLogout={() => window.location.href = "/api/auth/logout"} title="Job Results">
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading job results...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (!scrapingResult || scrapingResult.status === 'failed') {
    return (
      <DashboardLayout user={user} onLogout={() => window.location.href = "/api/auth/logout"} title="Job Results">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center min-h-[60vh]"
        >
          <div className="text-center glass-card p-8 max-w-md">
            <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Search Failed</h1>
            <p className="text-muted-foreground mb-6">
              {scrapingResult?.errorMessage || 'An error occurred while searching for jobs'}
            </p>
            <Link href="/">
              <Button className="btn-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  // Processing state
  if (scrapingResult.status !== 'completed' || !scrapingResult.enrichedResults) {
    return (
      <DashboardLayout user={user} onLogout={() => window.location.href = "/api/auth/logout"} title="Job Results">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center min-h-[60vh]"
        >
          <div className="text-center glass-card p-8 max-w-md">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Activity className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Search in Progress</h1>
            <p className="text-muted-foreground mb-6">
              Status: <span className="font-medium">{scrapingResult.status}</span>
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  const enrichedJobs = scrapingResult.enrichedResults?.jobs || [];
  const canApplyJobs = enrichedJobs.filter((job: any) => job.canApply);
  const cannotApplyJobs = enrichedJobs.filter((job: any) => !job.canApply);
  
  // Generate search-specific fake total jobs count (always under 2000)
  const generateSearchJobCount = (searchId: string) => {
    let hash = 0;
    for (let i = 0; i < searchId.length; i++) {
      hash = ((hash << 5) - hash) + searchId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Generate a number between 100-1999
    return 100 + Math.abs(hash % 1900);
  };

  const actualJobCount = enrichedJobs.length;
  const fakeTotalJobs = requestId ? generateSearchJobCount(requestId) : 847;
  
  // Calculate fake numbers for Pro Plan (total - actual jobs with contacts)
  const fakeProPlanJobs = fakeTotalJobs - canApplyJobs.length;

  return (
    <DashboardLayout user={user} onLogout={() => window.location.href = "/api/auth/logout"} title="Job Results">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header with stats */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Search Results</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Request ID: {requestId?.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="w-full md:w-auto h-10 md:h-9">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-3 md:p-4"
            >
              <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:text-left">
                <div>
                  <p className="text-xl md:text-2xl font-bold text-primary">{fakeTotalJobs.toLocaleString()}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Jobs</p>
                </div>
                <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-primary/20 hidden md:block" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-3 md:p-4"
            >
              <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:text-left">
                <div>
                  <p className="text-xl md:text-2xl font-bold text-accent">{canApplyJobs.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">With Contacts (Free Plan)</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-accent/20 hidden md:block" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs for different job categories */}
        <Tabs 
          defaultValue="with-contacts" 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            if (value === "without-contacts") {
              setShowProPlanModal(true);
            }
          }}
          className="space-y-4 md:space-y-6"
        >
          <TabsList className="glass-card p-1 w-full flex-col md:flex-row h-auto">
            <TabsTrigger value="with-contacts" className="flex-1 flex items-center gap-1 md:gap-2 text-xs md:text-sm py-3 w-full md:w-auto">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Free Plan</span>
              <span className="sm:hidden">Free</span>
              <span>({canApplyJobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="without-contacts" className="flex-1 flex items-center gap-1 md:gap-2 text-xs md:text-sm py-3 w-full md:w-auto">
              <Filter className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Pro Plan</span>
              <span className="sm:hidden">Pro</span>
              <span>({fakeProPlanJobs.toLocaleString()})</span>
            </TabsTrigger>
          </TabsList>

          {/* Jobs with contacts */}
          <TabsContent value="with-contacts" className="space-y-4">
            {canApplyJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <Mail className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Jobs with Contacts</h3>
                <p className="text-muted-foreground">
                  No contact information was found for the scraped jobs.
                </p>
              </motion.div>
            ) : (
              canApplyJobs.map((job: any, index: number) => (
                <motion.div
                  key={job.jobUrl || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FilteredJobCard job={job} resumeText={userResume} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Jobs without contacts - Pro Plan */}
          <TabsContent value="without-contacts" className="space-y-4 relative">
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-background/50 backdrop-blur-md z-10 rounded-lg" />
            
            {cannotApplyJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <CheckCircle className="h-16 w-16 text-green-600/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Jobs Have Contacts!</h3>
                <p className="text-muted-foreground">
                  Great news! Contact information was found for all jobs.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cannotApplyJobs.map((job: any, index: number) => (
                  <motion.div
                    key={job.jobUrl || index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-4 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="font-medium mb-2 line-clamp-1">
                      {job.jobTitle || "Unknown Position"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {job.companyName || "Unknown Company"} • {job.location || "Unknown Location"}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        No contacts found
                      </Badge>
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View on LinkedIn →
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>


        </Tabs>
      </motion.div>

      {/* Pro Plan Purchase Modal */}
      <Dialog open={showProPlanModal} onOpenChange={setShowProPlanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Upgrade to Pro Plan</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="text-lg">
                Unlock access to <span className="font-semibold text-primary">1000 jobs</span> with hidden contact information
              </div>
              
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-lg">Pro Plan Benefits:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Access all job postings without visible contacts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Advanced AI-powered contact discovery
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Priority email generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Unlimited job applications
                  </li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <div className="text-3xl font-bold">
                  ₹129<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    // TODO: Implement Indian payment gateway
                    window.location.href = "/subscribe";
                  }}
                >
                  Upgrade Now
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Cancel anytime. No questions asked.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}