import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FilteredJobCard } from "@/components/filtered-job-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  CheckCircle, 
  XCircle,
  Loader2,
  Binary,
  ArrowLeft,
  Network,
  Terminal
} from "lucide-react";
import { Link } from "wouter";

export default function Results() {
  const { requestId } = useParams();
  
  const { data: scrapingResult, isLoading } = useQuery({
    queryKey: ['/api/scrape-job', requestId],
    enabled: !!requestId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-primary font-mono">LOADING SCAN DATA...</p>
        </div>
      </div>
    );
  }

  if (!scrapingResult || scrapingResult.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <XCircle className="h-32 w-32 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">SCAN FAILED</h1>
          <p className="text-muted-foreground">{scrapingResult?.errorMessage || 'Unknown error occurred'}</p>
          <Link href="/">
            <button className="tech-btn mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              RETURN TO DASHBOARD
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (scrapingResult.status !== 'completed' || !scrapingResult.enrichedResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-32 w-32 text-primary animate-pulse mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">SCAN IN PROGRESS</h1>
          <p className="text-muted-foreground">Status: {scrapingResult.status}</p>
          <Link href="/">
            <button className="tech-btn mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              RETURN TO DASHBOARD
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const enrichedJobs = scrapingResult.enrichedResults?.enrichedJobs || [];
  const canApplyJobs = enrichedJobs.filter((job: any) => job.canApply);
  const cannotApplyJobs = enrichedJobs.filter((job: any) => !job.canApply);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 mb-8">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button className="tech-btn px-4 py-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  BACK
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold gradient-text flex items-center space-x-2">
                  <Network className="h-8 w-8" />
                  <span>SCAN RESULTS</span>
                </h1>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  ID: {requestId?.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm font-mono">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{enrichedJobs.length}</div>
                <div className="text-xs text-muted-foreground">TOTAL JOBS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{canApplyJobs.length}</div>
                <div className="text-xs text-muted-foreground">WITH CONTACTS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{cannotApplyJobs.length}</div>
                <div className="text-xs text-muted-foreground">NO CONTACTS</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="container mx-auto px-4 pb-12">
        <Tabs defaultValue="can-apply" className="w-full">
          <TabsList className="grid w-full grid-cols-2 tech-glass">
            <TabsTrigger value="can-apply" className="data-[state=active]:bg-primary/20">
              <CheckCircle className="h-4 w-4 mr-2" />
              Can Apply ({canApplyJobs.length})
            </TabsTrigger>
            <TabsTrigger value="cannot-apply" className="data-[state=active]:bg-primary/20">
              <XCircle className="h-4 w-4 mr-2" />
              No Contact Info ({cannotApplyJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="can-apply" className="mt-6">
            {canApplyJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {canApplyJobs.map((job: any, index: number) => (
                  <FilteredJobCard key={index} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 tech-card">
                <Binary className="h-16 w-16 text-primary/20 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground font-mono">NO JOBS WITH CONTACT INFORMATION</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cannot-apply" className="mt-6">
            {cannotApplyJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cannotApplyJobs.map((job: any, index: number) => (
                  <FilteredJobCard key={index} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 tech-card">
                <Terminal className="h-16 w-16 text-primary/20 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground font-mono">ALL JOBS HAVE CONTACT INFORMATION</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}