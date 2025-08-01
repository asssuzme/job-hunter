import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { linkedinUrlSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Link,
  Search,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity,
  Sparkles,
  Globe,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface JobScrapingResponse {
  id: string;
  status: "pending" | "processing" | "filtering" | "enriching" | "completed" | "failed";
  errorMessage?: string;
  results?: any;
  filteredResults?: any;
  enrichedResults?: any;
}

interface JobScraperProps {
  onComplete?: (requestId: string) => void;
}

export function JobScraper({ onComplete }: JobScraperProps = {}) {
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(linkedinUrlSchema),
    defaultValues: {
      linkedinUrl: "",
    },
  });

  // Scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async (data: { linkedinUrl: string; resumeText?: string }) => {
      const response = await apiRequest('/api/scrape-job', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      setCurrentRequestId(data.requestId);
      toast({
        title: "Search Started",
        description: "Searching for job listings..."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start job search",
        variant: "destructive",
      });
    },
  });

  // Status polling
  const { data: scrapingResult, isLoading: isPolling } = useQuery<JobScrapingResponse>({
    queryKey: ['/api/scrape-job', currentRequestId],
    enabled: !!currentRequestId,
    refetchInterval: ({ state }) => {
      const status = state.data?.status;
      return status === 'pending' || status === 'processing' || status === 'filtering' || status === 'enriching' ? 2000 : false;
    },
  });

  // Handle completion
  useEffect(() => {
    if (scrapingResult?.status === 'completed' && scrapingResult.enrichedResults) {
      const results = scrapingResult.enrichedResults as any;
      
      // Show completion message
      toast({
        title: "Search Complete",
        description: `Found ${results.totalCount || 0} jobs, ${results.canApplyCount || 0} with contact information`
      });

      // Invalidate dashboard stats to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(scrapingResult.id);
      }

    }
  }, [scrapingResult, onComplete, toast]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResumeText(data.text);
      setResumeFileName(file.name);
      toast({
        title: "Resume Uploaded",
        description: `${file.name} processed successfully`
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (data: { linkedinUrl: string }) => {
    scrapeMutation.mutate({ 
      linkedinUrl: data.linkedinUrl,
      resumeText: resumeText || undefined
    });
  };

  const isProcessing = scrapeMutation.isPending || (scrapingResult && ['pending', 'processing', 'filtering', 'enriching'].includes(scrapingResult.status));



  const getProgressPercentage = () => {
    if (!scrapingResult) return 0;
    switch (scrapingResult.status) {
      case 'pending': return 20;
      case 'processing': return 40;
      case 'filtering': return 60;
      case 'enriching': return 80;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getStatusMessage = () => {
    if (!scrapingResult) return "";
    switch (scrapingResult.status) {
      case 'pending':
        return 'Initializing search...';
      case 'processing':
        return 'Scraping LinkedIn jobs...';
      case 'filtering':
        return 'Filtering results...';
      case 'enriching':
        return 'Finding contact information...';
      case 'completed':
        return 'Search complete!';
      case 'failed':
        return 'Search failed';
      default:
        return scrapingResult.status;
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* LinkedIn URL Input */}
          <FormField
            control={form.control}
            name="linkedinUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  LinkedIn Job Search URL
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://www.linkedin.com/jobs/search/..."
                      className="pl-10 glass-input"
                      disabled={isProcessing}
                    />
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Paste the URL from your LinkedIn job search
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Resume (Optional)
            </label>
            <div className="glass-card p-6 border-dashed border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3"
                disabled={isProcessing}
              >
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {resumeFileName ? resumeFileName : 'Drop your resume here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resumeFileName ? 'Click to replace' : 'Supports .txt and .pdf files'}
                  </p>
                </div>
              </button>
            </div>
            {resumeFileName && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Resume uploaded successfully</span>
              </motion.div>
            )}
          </motion.div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing}
            className="btn-primary w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Start Job Search
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Status Display */}
      {scrapingResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                scrapingResult.status === 'completed' ? 'bg-green-500/10' : 
                scrapingResult.status === 'failed' ? 'bg-red-500/10' : 
                'bg-primary/10'
              }`}>
                <Activity className={`h-5 w-5 ${
                  scrapingResult.status === 'completed' ? 'text-green-600' : 
                  scrapingResult.status === 'failed' ? 'text-red-600' : 
                  'text-primary animate-pulse'
                }`} />
              </div>
              <div>
                <p className="font-medium">{getStatusMessage()}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {scrapingResult.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            {scrapingResult.status === 'completed' && (
              <Sparkles className="h-5 w-5 text-accent" />
            )}
          </div>

          {/* Progress Bar */}
          {['pending', 'processing', 'filtering', 'enriching'].includes(scrapingResult.status) && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          )}

          {/* Results Summary */}
          {scrapingResult.status === 'completed' && scrapingResult.enrichedResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {(scrapingResult.enrichedResults as any).totalCount || 0}
                </p>
                <p className="text-xs text-muted-foreground">Jobs Found</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-accent">
                  {(scrapingResult.enrichedResults as any).canApplyCount || 0}
                </p>
                <p className="text-xs text-muted-foreground">With Contacts</p>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {scrapingResult.status === 'failed' && (
            <Alert variant="destructive" className="glass-card">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {scrapingResult.errorMessage || 'An error occurred during the search'}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Timeline */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Status Timeline
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Search initiated</span>
              </motion.div>
              {['processing', 'filtering', 'enriching', 'completed'].includes(scrapingResult.status) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Scraping LinkedIn data</span>
                </motion.div>
              )}
              {['filtering', 'enriching', 'completed'].includes(scrapingResult.status) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Filtering results</span>
                </motion.div>
              )}
              {['enriching', 'completed'].includes(scrapingResult.status) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Finding contact information</span>
                </motion.div>
              )}
              {scrapingResult.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 text-green-600"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Search completed successfully</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}