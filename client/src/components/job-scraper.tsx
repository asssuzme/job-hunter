import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { linkedinUrlSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Link,
  Search,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Terminal,
  Cpu,
  Activity,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobScrapingResponse {
  id: string;
  status: "pending" | "processing" | "filtering" | "enriching" | "completed" | "failed";
  errorMessage?: string;
  results?: any;
  filteredResults?: any;
  enrichedResults?: any;
}

export function JobScraper() {
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
        title: "SCAN INITIATED",
        description: "Neural network processing engaged...",
        className: "tech-glass border-primary/50"
      });
    },
    onError: (error: any) => {
      toast({
        title: "SYSTEM ERROR",
        description: error.message || "Failed to initialize scan protocol",
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
        title: "FILE UPLOADED",
        description: `${file.name} processed successfully`,
        className: "tech-glass border-primary/50"
      });
    } catch (error: any) {
      toast({
        title: "UPLOAD ERROR",
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

  const getStatusMessage = () => {
    if (!scrapingResult) return "";
    switch (scrapingResult.status) {
      case 'pending':
        return 'INITIALIZING SCAN PROTOCOL...';
      case 'processing':
        return 'EXTRACTING DATA FROM LINKEDIN MATRIX...';
      case 'filtering':
        return 'APPLYING NEURAL FILTERS...';
      case 'enriching':
        return 'ENHANCING DATA WITH AI ALGORITHMS...';
      case 'completed':
        return 'SCAN COMPLETE - DATA ACQUIRED';
      case 'failed':
        return 'SCAN FAILED - SYSTEM ERROR';
      default:
        return (scrapingResult.status as string).toUpperCase();
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
                <FormLabel className="text-sm font-mono text-primary uppercase">
                  <Network className="h-4 w-4 inline-block mr-2" />
                  Target URL
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link className="h-4 w-4 text-primary/60" />
                    </div>
                    <input
                      {...field}
                      type="url"
                      placeholder="https://www.linkedin.com/jobs/search/..."
                      className="tech-input w-full pl-10"
                      disabled={isProcessing}
                    />
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  PASTE LINKEDIN JOB SEARCH URL
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resume Upload */}
          <div className="space-y-2">
            <label className="text-sm font-mono text-primary uppercase">
              <FileText className="h-4 w-4 inline-block mr-2" />
              Resume Data (Optional)
            </label>
            <div className="tech-glass p-4 border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
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
                className="w-full flex items-center justify-center space-x-2 py-3 text-primary hover:text-primary/80 transition-colors"
                disabled={isProcessing}
              >
                <Upload className="h-5 w-5" />
                <span className="font-mono text-sm">
                  {resumeFileName ? `LOADED: ${resumeFileName}` : 'UPLOAD RESUME (.TXT OR .PDF)'}
                </span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              ENHANCES EMAIL GENERATION WITH PERSONAL DATA
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`tech-btn w-full text-lg group ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <>
                <Cpu className="h-5 w-5 mr-2 animate-spin" />
                PROCESSING...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                INITIATE SCAN
              </>
            )}
          </button>
        </form>
      </Form>

      {/* Status Display */}
      {scrapingResult && (
        <div className="tech-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className={`h-6 w-6 ${scrapingResult.status === 'completed' ? 'text-primary' : scrapingResult.status === 'failed' ? 'text-destructive' : 'text-primary animate-pulse'}`} />
              <span className="font-mono text-sm text-primary">
                {getStatusMessage()}
              </span>
            </div>
            <span className="text-xs font-mono text-primary/60">
              ID: {scrapingResult.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Progress Bar */}
          {['pending', 'processing', 'filtering', 'enriching'].includes(scrapingResult.status) && (
            <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary processing-bar"></div>
            </div>
          )}

          {/* Results Summary */}
          {scrapingResult.status === 'completed' && scrapingResult.enrichedResults && (
            <Alert className="tech-glass border-primary/50">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="font-mono text-sm">
                SCAN COMPLETE: {(scrapingResult.enrichedResults as any).totalCount || 0} TARGETS IDENTIFIED, {(scrapingResult.enrichedResults as any).canApplyCount || 0} WITH CONTACT DATA
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {scrapingResult.status === 'failed' && (
            <Alert className="tech-glass border-destructive/50">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="font-mono text-sm">
                ERROR: {scrapingResult.errorMessage || 'UNKNOWN SYSTEM FAILURE'}
              </AlertDescription>
            </Alert>
          )}

          {/* Terminal Output */}
          <div className="bg-black/50 p-4 rounded font-mono text-xs text-primary/80 space-y-1">
            <div className="flex items-center space-x-2">
              <Terminal className="h-3 w-3" />
              <span>SYSTEM LOG:</span>
            </div>
            <div className="pl-5 space-y-0.5 text-primary/60">
              <div>&gt; Connection established...</div>
              <div>&gt; Authentication verified...</div>
              <div>&gt; Scan protocol activated...</div>
              {scrapingResult.status === 'completed' && <div className="text-primary">&gt; Data transfer complete.</div>}
              {scrapingResult.status === 'failed' && <div className="text-destructive">&gt; Critical error detected.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}