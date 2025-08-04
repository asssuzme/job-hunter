import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { linkedinUrlSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link,
  Search,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Activity,
  Sparkles,
  Globe,
  Zap,
  MapPin,
  Briefcase,
  Lock,
  Filter,
  Mail,
  Lightbulb,
  X
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
import { DotsLoader } from "@/components/ui/loading-animations";

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
  workType: z.string().min(1, "Please select a work type"),
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

// Predefined locations (Indian cities + International)
const locations = [
  // Major Indian Cities
  { value: "Bengaluru", label: "Bengaluru (Bangalore)" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi", label: "Delhi" },
  { value: "Chennai", label: "Chennai" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Kolkata", label: "Kolkata" },
  { value: "Pune", label: "Pune" },
  { value: "Ahmedabad", label: "Ahmedabad" },
  { value: "Jaipur", label: "Jaipur" },
  { value: "Lucknow", label: "Lucknow" },
  { value: "Noida", label: "Noida" },
  { value: "Gurugram", label: "Gurugram (Gurgaon)" },
  { value: "Indore", label: "Indore" },
  { value: "Kochi", label: "Kochi" },
  { value: "Chandigarh", label: "Chandigarh" },
  { value: "Bhopal", label: "Bhopal" },
  { value: "Nagpur", label: "Nagpur" },
  { value: "Visakhapatnam", label: "Visakhapatnam" },
  { value: "Surat", label: "Surat" },
  { value: "Vadodara", label: "Vadodara" },
  // International Cities
  { value: "Singapore", label: "Singapore" },
  { value: "Dubai", label: "Dubai, UAE" },
  { value: "London", label: "London, UK" },
  { value: "New York", label: "New York, USA" },
  { value: "San Francisco", label: "San Francisco, USA" },
  { value: "Seattle", label: "Seattle, USA" },
  { value: "Toronto", label: "Toronto, Canada" },
  { value: "Sydney", label: "Sydney, Australia" },
  { value: "Tokyo", label: "Tokyo, Japan" },
  { value: "Berlin", label: "Berlin, Germany" },
];

interface JobScraperProps {
  onComplete?: (requestId: string) => void;
}

export function JobScraper({ onComplete }: JobScraperProps = {}) {
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const abortRef = useRef(false); // Use ref for immediate abort tracking
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
    mode: "onChange", // Validate on change to clear errors immediately
  });

  // Check for existing resume on component mount
  useEffect(() => {
    const checkExistingResume = async () => {
      try {
        const response = await fetch('/api/user/resume', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hasResume && data.resumeText) {
            setResumeText(data.resumeText);
            setResumeFileName(data.fileName || 'Saved Resume');
            setHasExistingResume(true);
            toast({
              title: "Resume Loaded",
              description: "Your saved resume has been loaded automatically."
            });
          } else {
            setHasExistingResume(false);
          }
        }
      } catch (error) {
        console.error("Error checking for existing resume:", error);
        setHasExistingResume(false);
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
      // Reset abort flags when starting new search
      abortRef.current = false;
      setIsAborted(false);
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
    queryKey: [`/api/scrape-job/${currentRequestId}`],
    enabled: !!currentRequestId && !isAborted && !abortRef.current,
    refetchInterval: ({ state }) => {
      // Check ref for immediate abort
      if (abortRef.current || isAborted || !currentRequestId) return false;
      const status = state.data?.status;
      return status === 'pending' || status === 'processing' || status === 'filtering' || status === 'enriching' ? 2000 : false;
    },
    gcTime: 0, // Don't cache aborted queries
    staleTime: 0, // Always fetch fresh data
  });

  // Handle completion
  useEffect(() => {
    if (isAborted) return; // Don't process completion if aborted
    
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
  }, [scrapingResult, onComplete, toast, isAborted]);

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
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResumeText(data.text);
      setResumeFileName(file.name);
      setHasExistingResume(true); // Mark that user now has a resume
      toast({
        title: "Resume Uploaded & Saved",
        description: `${file.name} has been saved to your account. You won't need to upload it again.`
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
    // Check if resume is required (for first-time users)
    if (!hasExistingResume && !resumeText) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume to start your first job search.",
        variant: "destructive",
      });
      return;
    }

    // The form data is already validated by react-hook-form + zod
    scrapeMutation.mutate({ 
      keyword: data.keyword,
      location: data.location,
      workType: data.workType,
      resumeText: resumeText || undefined
    });
  };

  const isProcessing = !isAborted && (
    scrapeMutation.isPending || 
    (currentRequestId && !scrapingResult) || // Loading the scraping result
    (scrapingResult && ['pending', 'processing', 'filtering', 'enriching'].includes(scrapingResult.status))
  );

  // Use state for smooth progress animation
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [dynamicMessage, setDynamicMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Rotating messages
  const rotatingMessages = [
    "This might take a few minutes — we're pulling thousands of listings.",
    "Our AI is scanning for the best matches.",
    "Almost there — mapping contacts to companies.",
    "Hang tight — good things take time 🚀."
  ];

  // Update progress smoothly over 4 minutes
  useEffect(() => {
    if (!isProcessing || isAborted) {
      setAnimatedProgress(0);
      setStartTime(null);
      setShowSuccess(false);
      return;
    }

    // Set start time when processing begins
    if (!startTime) {
      setStartTime(Date.now());
    }

    const totalDuration = 4 * 60 * 1000; // 4 minutes in milliseconds
    const interval = setInterval(() => {
      if (!startTime || isAborted) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 99); // Cap at 99% until actually complete
      
      // If actually completed, jump to 100%
      if (scrapingResult?.status === 'completed') {
        setAnimatedProgress(100);
        setShowSuccess(true);
        clearInterval(interval);
      } else {
        setAnimatedProgress(progress);
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isProcessing, startTime, scrapingResult?.status, isAborted]);

  // Rotate dynamic messages
  useEffect(() => {
    if (!isProcessing || isAborted) return;

    let messageIndex = 0;
    setDynamicMessage(rotatingMessages[0]);

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % rotatingMessages.length;
      setDynamicMessage(rotatingMessages[messageIndex]);
    }, 25000); // Change message every 25 seconds

    return () => clearInterval(interval);
  }, [isProcessing, isAborted]);

  const getProgressPercentage = () => {
    return Math.floor(animatedProgress);
  };

  const getStatusMessage = () => {
    const progress = animatedProgress;
    
    if (progress < 20) return "Connecting to LinkedIn…";
    if (progress < 40) return "Scraping job listings…";
    if (progress < 60) return "Analyzing job descriptions…";
    if (progress < 80) return "Finding decision makers…";
    if (progress < 100) return "Preparing your results…";
    return "Search complete!";
  };

  const getEstimatedTime = () => {
    if (!startTime) return "~4 minutes";
    
    const elapsed = Date.now() - startTime;
    const totalDuration = 4 * 60 * 1000; // 4 minutes
    const remaining = Math.max(0, totalDuration - elapsed);
    const minutes = Math.ceil(remaining / 60000);
    
    if (minutes === 0) return "Almost done...";
    if (minutes === 1) return "~1 minute left";
    return `~${minutes} minutes left`;
  };

  // Handle abort
  const handleAbort = async () => {
    // Set ref immediately for instant abort
    abortRef.current = true;
    setIsAborted(true);
    
    // Cancel ALL scrape-job queries
    queryClient.cancelQueries({ 
      predicate: (query) => {
        return query.queryKey[0]?.toString().includes('/api/scrape-job') || false;
      }
    });
    
    // Remove ALL scrape-job queries from cache
    queryClient.removeQueries({ 
      predicate: (query) => {
        return query.queryKey[0]?.toString().includes('/api/scrape-job') || false;
      }
    });
    
    // Call backend to abort Apify actors
    if (currentRequestId) {
      try {
        await apiRequest(`/api/scrape-job/${currentRequestId}/abort`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Failed to abort Apify actors:', error);
      }
    }
    
    // Clear the request ID to prevent any further polling
    setCurrentRequestId(null);
    setAnimatedProgress(0);
    
    toast({
      title: "Search Aborted",
      description: "Job search has been cancelled",
    });
  };

  // Show full-screen loading animation when processing
  if (isProcessing) {
    return (
      <motion.div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ minHeight: "calc(90vh - 120px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: "400% 400%"
            }}
          />
          {/* Floating orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-2xl px-4">
          <motion.div 
            className="space-y-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Success animation */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="fixed inset-0 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white dark:bg-gray-800 rounded-full p-8 shadow-2xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="h-24 w-24 text-green-500" />
                  </motion.div>
                  {/* Confetti effect */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 400,
                        y: (Math.random() - 0.5) * 400,
                        opacity: 0,
                        rotate: Math.random() * 360,
                      }}
                      transition={{
                        duration: 1,
                        delay: i * 0.02,
                        ease: "easeOut"
                      }}
                      style={{
                        left: "50%",
                        top: "50%",
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Loading Container */}
            <div className="text-center space-y-6">
              <motion.div className="relative inline-block">
                {/* Pulsing glow behind icon */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Animated magnifying glass with AI sparkles */}
                <motion.div
                  className="relative"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Search className="h-24 w-24 text-primary relative z-10" />
                  {/* AI sparkles */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeOut"
                      }}
                      style={{
                        left: `${30 + i * 20}%`,
                        top: `${20 + i * 15}%`,
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <div className="space-y-3">
                <motion.h2 
                  className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  key={getStatusMessage()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {getStatusMessage()}
                </motion.h2>
                <motion.p 
                  className="text-lg text-muted-foreground"
                  key={getEstimatedTime()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {getEstimatedTime()}
                </motion.p>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative">
              {/* Glow effect */}
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-75"
                animate={{
                  opacity: [0.5, 0.75, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative bg-background/80 backdrop-blur-xl rounded-full p-6 border border-primary/20">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <motion.span 
                      className="text-sm font-medium flex items-center gap-2"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      Processing
                    </motion.span>
                    <motion.span 
                      className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      key={getProgressPercentage()}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {getProgressPercentage()}%
                    </motion.span>
                  </div>
                  
                  <div className="relative h-6 bg-secondary/30 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      style={{ width: `${animatedProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Animated shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </motion.div>
                    
                    {/* Progress bar glow at the end */}
                    <motion.div
                      className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 blur-md"
                      style={{ left: `${animatedProgress - 2}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic message */}
            <motion.div
              className="text-center"
              key={dynamicMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-muted-foreground italic">{dynamicMessage}</p>
            </motion.div>

            {/* Cancel Button */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={handleAbort}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel Search
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

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

          {/* Location Combobox */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
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
                          <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                          {field.value || "Select or type a location..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search city..." 
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center text-sm">
                            No matching city found.
                            <br />
                            <span className="text-muted-foreground">
                              Type your location and press Enter
                            </span>
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Popular Cities">
                          {locations
                            .filter((location) => 
                              location.label.toLowerCase().includes(field.value?.toLowerCase() || '') ||
                              location.value.toLowerCase().includes(field.value?.toLowerCase() || '')
                            )
                            .slice(0, 10)
                            .map((location) => (
                              <CommandItem
                                key={location.value}
                                value={location.label}
                                onSelect={() => {
                                  field.onChange(location.value);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === location.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {location.label}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Start typing to see suggestions (e.g., "bang" for Bangalore)
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
                <Select onValueChange={field.onChange} value={field.value}>
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

          {/* Resume Section - Different UI based on whether user has existing resume */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              Resume {hasExistingResume ? '' : '(Required)'}
              {!hasExistingResume && (
                <span className="text-red-500 text-xs">*</span>
              )}
            </label>
            
            {isLoadingResume ? (
              <div className="glass-card p-4 md:p-6 border border-primary/20 min-h-[120px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading your saved resume...</span>
                </div>
              </div>
            ) : hasExistingResume ? (
              // Show existing resume info with link to settings to change
              <div className="glass-card p-4 md:p-6 border border-green-500/20 bg-green-500/5 min-h-[120px] flex items-center">
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {resumeFileName || 'Resume Loaded'}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Your saved resume will be used automatically
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/settings', '_blank')}
                    className="text-xs border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/10"
                  >
                    Change in Settings
                  </Button>
                </div>
              </div>
            ) : (
              // Show upload interface for new users
              <div className={`glass-card p-4 md:p-6 border-dashed border-2 transition-all cursor-pointer group min-h-[120px] flex items-center ${
                !resumeText ? 'border-red-500/30 hover:border-red-500/50' : 'border-primary/20 hover:border-primary/40'
              }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.jpg,.jpeg,.png,.webp"
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
                    <p className="font-medium">Drop your resume here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-red-500">Required for first search</span> • Supports .txt, .pdf, and image files
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Will be saved to your account for future searches
                    </p>
                  </div>
                </button>
              </div>
            )}
          </motion.div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing || (!hasExistingResume && !resumeText)}
            className={`w-full h-12 text-base ${
              (!hasExistingResume && !resumeText) 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'btn-primary'
            }`}
            size="lg"
          >
            {isProcessing ? (
              <>
                <DotsLoader className="mr-2" />
                Processing...
              </>
            ) : (!hasExistingResume && !resumeText) ? (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Resume to Continue
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

          {/* Enhanced Loading Animation */}
          {['pending', 'processing', 'filtering', 'enriching'].includes(scrapingResult.status) && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated Progress Section */}
              <div className="relative">
                {/* Background glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Progress Bar Container */}
                <div className="relative glass-card p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span className="text-sm font-medium">Progress</span>
                    </div>
                    <motion.span 
                      className="text-sm font-bold text-primary"
                      key={getProgressPercentage()}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {getProgressPercentage()}%
                    </motion.span>
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Animated shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Dynamic Loading Messages */}
              <motion.div
                key={scrapingResult.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                {/* Status-specific animations */}
                {scrapingResult.status === 'pending' && (
                  <div className="flex flex-col items-center gap-3">
                    <motion.div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <Globe className="h-8 w-8 text-primary relative z-10" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">
                      Connecting to LinkedIn...
                    </span>
                  </div>
                )}
                
                {scrapingResult.status === 'processing' && (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      className="flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-3 bg-primary rounded-full"
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </motion.div>
                    <span className="text-sm text-muted-foreground">
                      Scanning LinkedIn for opportunities...
                    </span>
                  </div>
                )}

                {scrapingResult.status === 'filtering' && (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 180 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Filter className="h-5 w-5 text-primary" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">
                      Filtering the best matches for you...
                    </span>
                  </div>
                )}

                {scrapingResult.status === 'enriching' && (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Mail className="h-5 w-5 text-primary" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">
                      Finding contact information...
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Fun Facts / Tips Carousel */}
              <motion.div
                className="glass-card p-3 border border-primary/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <motion.p
                    key={Math.floor(Date.now() / 5000)} // Change every 5 seconds
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-muted-foreground"
                  >
                    {[
                      "💡 Did you know? Personalized emails have 29% higher open rates!",
                      "🎯 Pro tip: Follow up within 24 hours for best response rates",
                      "📊 Companies receive 100+ applications per job posting on average",
                      "⚡ Our AI finds hidden contact info not visible on job posts",
                      "🔍 We're checking multiple data sources for accuracy"
                    ][Math.floor(Date.now() / 5000) % 5]}
                  </motion.p>
                </div>
              </motion.div>

              {/* Live Status Updates */}
              <motion.div
                className="flex items-center justify-center gap-2 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-muted-foreground">
                  {scrapingResult.status === 'processing' && 'Analyzing job descriptions...'}
                  {scrapingResult.status === 'filtering' && 'Matching your requirements...'}
                  {scrapingResult.status === 'enriching' && 'Verifying contact details...'}
                  {scrapingResult.status === 'pending' && 'Establishing secure connection...'}
                </span>
              </motion.div>

              {/* Animated Job Cards Preview */}
              <motion.div
                className="mt-4 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <p className="text-xs text-muted-foreground text-center mb-2">Finding perfect matches...</p>
                <div className="flex gap-2 overflow-hidden">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="flex-1 glass-card p-3 border border-white/5"
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ 
                        opacity: [0, 1, 1, 0],
                        x: [100, 0, -100, -200],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 1.3,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="space-y-1">
                        <div className="h-2 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded w-3/4" />
                        <div className="h-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded w-1/2" />
                        <div className="h-1.5 bg-primary/20 rounded w-2/3 mt-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Animated Stats Preview */}
              {scrapingResult.status === 'enriching' && (
                <motion.div
                  className="grid grid-cols-3 gap-2 mt-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[
                    { label: "Jobs Found", color: "from-blue-500 to-indigo-500", icon: "💼" },
                    { label: "With Contacts", color: "from-green-500 to-emerald-500", icon: "✉️" },
                    { label: "Companies", color: "from-purple-500 to-pink-500", icon: "🏢" }
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="glass-card p-2 text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                    >
                      <motion.div
                        className="text-lg mb-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      >
                        {stat.icon}
                      </motion.div>
                      <motion.div
                        className={`h-1.5 bg-gradient-to-r ${stat.color} rounded-full`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, delay: 1 + i * 0.2 }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Results Summary */}
          {scrapingResult.status === 'completed' && scrapingResult.enrichedResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Fake total jobs display */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {(scrapingResult.enrichedResults as any).fakeTotalJobs || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Jobs Found</p>
                </div>
                <div className="glass-card p-4 text-center border-green-500/20">
                  <p className="text-2xl font-bold text-green-600">
                    {(scrapingResult.enrichedResults as any).freeJobs || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                  <p className="text-xs text-green-600/70">With Contacts</p>
                </div>
                <div className="glass-card p-4 text-center border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-600">
                    {(scrapingResult.enrichedResults as any).lockedJobs || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Pro Plan Only</p>
                  <p className="text-xs text-amber-600/70">🔒 Locked</p>
                </div>
              </div>
              
              {/* Upgrade prompt if there are locked jobs */}
              {(scrapingResult.enrichedResults as any).lockedJobs > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-4 border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-medium">
                        {(scrapingResult.enrichedResults as any).lockedJobs} jobs with contact info are available in Pro Plan
                      </p>
                    </div>
                    <Button size="sm" className="btn-primary">
                      Upgrade to Pro
                    </Button>
                  </div>
                </motion.div>
              )}
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