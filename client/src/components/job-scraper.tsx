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
  Zap,
  MapPin,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface JobScrapingResponse {
  id: string;
  status: "pending" | "processing" | "filtering" | "enriching" | "completed" | "failed";
  errorMessage?: string;
  results?: any;
  filteredResults?: any;
  enrichedResults?: any;
}

// Define new schema for job search form
const jobSearchSchema = z.object({
  keyword: z.string().min(1, "Job keyword is required"),
  location: z.string().min(1, "Location is required"),
  workType: z.enum(["1", "2", "3"], {
    required_error: "Please select a work type",
  }),
});

type JobSearchFormData = z.infer<typeof jobSearchSchema>;

// Predefined job roles
const jobRoles = [
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "Data Analyst", label: "Data Analyst" },
  { value: "Business Analyst", label: "Business Analyst" },
  { value: "Project Manager", label: "Project Manager" },
  { value: "DevOps Engineer", label: "DevOps Engineer" },
  { value: "Full Stack Developer", label: "Full Stack Developer" },
  { value: "Frontend Developer", label: "Frontend Developer" },
  { value: "Backend Developer", label: "Backend Developer" },
  { value: "UI/UX Designer", label: "UI/UX Designer" },
  { value: "Marketing Manager", label: "Marketing Manager" },
  { value: "Sales Executive", label: "Sales Executive" },
  { value: "HR Manager", label: "HR Manager" },
  { value: "Account Manager", label: "Account Manager" },
  { value: "Machine Learning Engineer", label: "Machine Learning Engineer" },
  { value: "Quality Assurance Engineer", label: "Quality Assurance Engineer" },
  { value: "Technical Writer", label: "Technical Writer" },
  { value: "Solutions Architect", label: "Solutions Architect" },
  { value: "Cloud Engineer", label: "Cloud Engineer" },
];

interface JobScraperProps {
  onComplete?: (requestId: string) => void;
}

export function JobScraper({ onComplete }: JobScraperProps = {}) {
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<JobSearchFormData>({
    resolver: zodResolver(jobSearchSchema),
    defaultValues: {
      keyword: "",
      location: "",
      workType: "1",
    },
  });

  // Check for existing resume on component mount
  useEffect(() => {
    const checkExistingResume = async () => {
      try {
        const response = await fetch('/api/user/resume');
        if (response.ok) {
          const data = await response.json();
          if (data.hasResume && data.resumeText) {
            setResumeText(data.resumeText);
            setResumeFileName(data.fileName || 'Saved Resume');
            toast({
              title: "Resume Loaded",
              description: "Your saved resume has been loaded automatically."
            });
          }
        }
      } catch (error) {
        console.error("Error checking for existing resume:", error);
      } finally {
        setIsLoadingResume(false);
      }
    };

    checkExistingResume();
  }, [toast]);

  // Scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async (data: { keyword: string; location: string; workType: string; resumeText?: string }) => {
      // First, generate the LinkedIn URL
      const urlResponse = await apiRequest('/api/generate-linkedin-url', {
        method: 'POST',
        body: JSON.stringify({
          keyword: data.keyword,
          location: data.location,
          workType: data.workType
        })
      });

      if (!urlResponse.linkedinUrl) {
        throw new Error(urlResponse.error || "Failed to generate LinkedIn URL");
      }

      // Show location normalization info if available
      if (urlResponse.message) {
        toast({
          title: "Location Normalized",
          description: urlResponse.message,
        });
      }

      // Then, start the scraping process with the generated URL
      const response = await apiRequest('/api/scrape-job', {
        method: 'POST',
        body: JSON.stringify({
          linkedinUrl: urlResponse.linkedinUrl,
          resumeText: data.resumeText
        }),
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

  const handleSubmit = (data: JobSearchFormData) => {
    scrapeMutation.mutate({ 
      keyword: data.keyword,
      location: data.location,
      workType: data.workType,
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
    <div className="space-y-4 md:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 md:space-y-6">
          {/* Job Keyword Combobox */}
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Job Keyword
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between glass-input h-12 text-base font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isProcessing}
                      >
                        <div className="flex items-center">
                          <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                          {field.value || "Select or type a job role..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type custom role..." 
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center text-sm">
                            No matching role found.
                            <br />
                            <span className="text-muted-foreground">
                              Press Enter to use "{field.value}" as custom role
                            </span>
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Popular Job Roles">
                          {jobRoles.map((role) => (
                            <CommandItem
                              key={role.value}
                              value={role.value}
                              onSelect={(currentValue) => {
                                field.onChange(currentValue);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === role.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {role.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Choose from popular roles or type your own
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location Input */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="text"
                      placeholder="e.g., Bengaluru, Mumbai, Delhi"
                      className="pl-10 glass-input h-12 text-base"
                      disabled={isProcessing}
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Enter city name (we'll normalize it automatically)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Work Type Dropdown */}
          <FormField
            control={form.control}
            name="workType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Work Type
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="glass-input h-12 text-base" disabled={isProcessing}>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">On-site</SelectItem>
                    <SelectItem value="2">Remote</SelectItem>
                    <SelectItem value="3">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select your preferred work arrangement
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
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              Resume (Optional)
            </label>
            <div className="glass-card p-4 md:p-6 border-dashed border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group min-h-[120px] flex items-center">
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
                    {resumeFileName ? resumeFileName : isLoadingResume ? 'Loading saved resume...' : 'Drop your resume here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resumeFileName ? 'Click to replace' : 'Supports .txt and .pdf files'}
                  </p>
                </div>
              </button>
            </div>
            {(resumeFileName || (resumeText && !isLoadingResume)) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{resumeFileName ? 'Resume uploaded successfully' : 'Using your saved resume'}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing}
            className="btn-primary w-full h-12 text-base"
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