import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { JobForm } from "@/components/job-form";
import { JobCard } from "@/components/job-card";
import { FilteredJobCard } from "@/components/filtered-job-card";
import { ResumeUpload } from "@/components/resume-upload";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrapingState } from "@/lib/types";
import { JobScrapingRequest, ScrapingResult, FilteredResult, EnrichedResult } from "@shared/schema";
import { Loader2, AlertTriangle, Download, Trash2, Linkedin, Settings, HelpCircle, Plus, Filter, CheckCircle, XCircle } from "lucide-react";

export default function Home() {
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [scrapingState, setScrapingState] = useState<ScrapingState>('idle');
  const [showFiltered, setShowFiltered] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'can-apply' | 'cannot-apply'>('all');
  const [resumeText, setResumeText] = useState<string | null>(null);

  // Query to poll for scraping results
  const { data: scrapingRequest, isLoading: isPolling } = useQuery<JobScrapingRequest>({
    queryKey: ['/api/scrape-job', currentRequestId],
    enabled: !!currentRequestId,
    refetchInterval: scrapingState === 'loading' ? 2000 : false,
  });

  // Check status and update state
  useEffect(() => {
    if (scrapingRequest?.status === 'completed') {
      setScrapingState('success');
    } else if (scrapingRequest?.status === 'failed') {
      setScrapingState('error');
    } else if (scrapingRequest?.status === 'cancelled') {
      setScrapingState('cancelled');
    } else if (['filtering', 'enriching'].includes(scrapingRequest?.status || '')) {
      // Keep loading state during filtering and enriching
      if (scrapingState !== 'loading') setScrapingState('loading');
    }
  }, [scrapingRequest?.status]);

  const scrapeMutation = useMutation({
    mutationFn: async (linkedinUrl: string) => {
      const response = await apiRequest('POST', '/api/scrape-job', { 
        linkedinUrl,
        resumeText 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentRequestId(data.requestId);
      setScrapingState('loading');
    },
    onError: () => {
      setScrapingState('error');
    },
  });

  const handleSubmit = (url: string) => {
    setScrapingState('loading');
    scrapeMutation.mutate(url);
  };

  const handleRetry = () => {
    if (scrapingRequest?.linkedinUrl) {
      handleSubmit(scrapingRequest.linkedinUrl);
    }
  };

  const handleClear = () => {
    setCurrentRequestId(null);
    setScrapingState('idle');
  };

  const handleCancel = async () => {
    if (!currentRequestId) return;
    
    try {
      await apiRequest('POST', `/api/scrape-job/${currentRequestId}/cancel`);
      setScrapingState('cancelled');
      // Refresh the query to get the cancelled status
      queryClient.invalidateQueries({ queryKey: ['/api/scrape-job', currentRequestId] });
    } catch (error) {
      console.error('Failed to cancel scraping:', error);
    }
  };

  const results = scrapingRequest?.results as ScrapingResult | null;
  const filteredResults = scrapingRequest?.filteredResults as FilteredResult | null;
  const enrichedResults = scrapingRequest?.enrichedResults as EnrichedResult | null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resume Upload Section */}
        <div className="mb-8">
          <ResumeUpload onResumeTextChange={setResumeText} />
        </div>

        <JobForm 
          onSubmit={handleSubmit} 
          isLoading={scrapingState === 'loading'} 
        />

        {/* Loading State */}
        {scrapingState === 'loading' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-center space-x-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">
                {scrapingRequest?.status === 'enriching' 
                  ? 'Enriching job posts with contact information...' 
                  : scrapingRequest?.status === 'filtering'
                  ? 'Filtering and processing results...'
                  : 'Scraping job data from LinkedIn...'}
              </span>
            </div>
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/5"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds depending on the job listing size</p>
            </div>
            <div className="mt-4 flex justify-center">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Scraping
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {scrapingState === 'error' && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium mb-1">Scraping Failed</h3>
                  <p className="text-sm">
                    {scrapingRequest?.errorMessage || 
                     "Unable to process the LinkedIn URL. Please check that the URL is valid and the job posting is accessible."}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="ml-4 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Cancelled State */}
        {scrapingState === 'cancelled' && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <XCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium mb-1">Scraping Cancelled</h3>
                  <p className="text-sm">
                    The scraping process was cancelled by user request.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                  className="ml-4 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                >
                  Clear
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {scrapingState === 'success' && results && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Processing Complete
                  </h2>
                  <p className="text-sm text-gray-500">
                    Scraped: {results.totalCount} | Filtered: {filteredResults?.totalCount || 0} | Can Apply: {enrichedResults?.canApplyCount || 0} jobs
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Select value={viewMode} onValueChange={(value: 'all' | 'can-apply' | 'cannot-apply') => setViewMode(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="can-apply">Can Apply</SelectItem>
                      <SelectItem value="cannot-apply">Cannot Apply</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant={showFiltered ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setShowFiltered(!showFiltered)}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {showFiltered ? 'Filtered' : 'Raw'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Filter and Sort Controls */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <Select defaultValue="date">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Posted</SelectItem>
                      <SelectItem value="company">Company Name</SelectItem>
                      <SelectItem value="title">Job Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Location:</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {/* Dynamically populate based on available locations */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Job Results */}
            <div className="space-y-6">
              {/* Display Raw Results */}
              {!showFiltered && results.jobs.map((job, index) => (
                <JobCard key={index} job={job} />
              ))}

              {/* Display Enriched Results */}
              {showFiltered && enrichedResults && viewMode === 'all' && (
                <div className="space-y-12">
                  {/* Can Apply Section */}
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-green-900 flex items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          Can Apply Directly ({enrichedResults.jobs.filter(job => job.canApply).length} jobs)
                        </h3>
                        <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          Jobs with Email Contacts
                        </span>
                      </div>
                      <p className="text-green-800 mb-6">These jobs have email contacts available for direct outreach</p>
                      <div className="space-y-4">
                        {enrichedResults.jobs.filter(job => job.canApply).length > 0 ? (
                          enrichedResults.jobs
                            .filter(job => job.canApply)
                            .map((job, index) => (
                              <FilteredJobCard key={`can-apply-${index}`} job={job} resumeText={resumeText} />
                            ))
                        ) : (
                          <div className="text-center py-8 text-green-700">
                            No jobs with contact information found in this batch
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cannot Apply Section */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          <XCircle className="h-6 w-6 text-gray-500" />
                          Cannot Apply Directly ({enrichedResults.jobs.filter(job => !job.canApply).length} jobs)
                        </h3>
                        <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                          Apply via LinkedIn/Company Portal
                        </span>
                      </div>
                      <p className="text-gray-700 mb-6">These jobs require applying through LinkedIn or company websites</p>
                      <div className="space-y-4">
                        {enrichedResults.jobs.filter(job => !job.canApply).length > 0 ? (
                          enrichedResults.jobs
                            .filter(job => !job.canApply)
                            .map((job, index) => (
                              <FilteredJobCard key={`cannot-apply-${index}`} job={job} resumeText={resumeText} />
                            ))
                        ) : (
                          <div className="text-center py-8 text-gray-600">
                            All jobs have contact information available!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Display filtered view based on viewMode */}
              {showFiltered && enrichedResults && viewMode !== 'all' && (() => {
                let jobsToShow = enrichedResults.jobs;

                // Apply viewMode filtering
                jobsToShow = jobsToShow.filter(job => 
                  viewMode === 'can-apply' ? job.canApply : !job.canApply
                );

                if (jobsToShow.length === 0) {
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                      <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
                      <p className="text-gray-500">
                        {viewMode === 'can-apply' && 'No jobs with contact information available.' ||
                         viewMode === 'cannot-apply' && 'All jobs have contact information available.' ||
                         'No jobs match the current filters.'}
                      </p>
                    </div>
                  );
                }

                return jobsToShow.map((job, index) => (
                  <FilteredJobCard key={index} job={job} resumeText={resumeText} />
                ));
              })()}

              {/* Display Filtered Results (fallback if no enrichment) */}
              {showFiltered && !enrichedResults && filteredResults && filteredResults.jobs.map((job, index) => (
                <FilteredJobCard key={index} job={job} resumeText={resumeText} />
              ))}

              {/* No Results Message */}
              {showFiltered && !enrichedResults && !filteredResults && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Filtered Results</h3>
                  <p className="text-gray-500">
                    Processing is still in progress or no results match the filtering criteria.
                  </p>
                </div>
              )}
            </div>

            {/* Load More Button (if there are more results to show) */}
            <div className="text-center pt-6">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Load More Results
              </Button>
            </div>
          </div>
        )}

        {/* Loading Skeletons for job cards */}
        {scrapingState === 'loading' && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Linkedin className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">LinkedIn Scraper</span>
              </div>
              <p className="text-sm text-gray-600 max-w-md">
                Professional job data extraction service powered by Apify. Scrape comprehensive job and company information from LinkedIn efficiently and accurately.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Job data extraction</li>
                <li>• Company information</li>
                <li>• Bulk processing</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Status Page</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2024 LinkedIn Scraper. Built with Apify API.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
