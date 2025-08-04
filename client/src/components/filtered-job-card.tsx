import { useState, useRef } from "react";
import { FilteredJobData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, User, Briefcase, DollarSign, Mail, CheckCircle, XCircle, Send, Loader2, Sparkles, Globe, Building } from "lucide-react";
import { CompanyProfileModal } from "./company-profile-modal";
import { EmailComposerModal } from "./email-composer-modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface FilteredJobCardProps {
  job: FilteredJobData;
  resumeText?: string | null;
}

export function FilteredJobCard({ job, resumeText }: FilteredJobCardProps) {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showGmailAuth, setShowGmailAuth] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string>("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [applyStep, setApplyStep] = useState<'idle' | 'checking-gmail' | 'scraping-company' | 'generating-email' | 'ready'>('idle');
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  // Check Gmail authorization status
  const { data: gmailStatus, refetch: refetchGmailStatus } = useQuery({
    queryKey: ['/api/auth/gmail/status'],
    enabled: false // Only fetch when needed
  }) as { data?: { authorized?: boolean; needsRefresh?: boolean; email?: string }; refetch: () => void };

  const companyMutation = useMutation({
    mutationFn: async (companyLinkedinUrl: string) => {
      return await apiRequest('/api/scrape-company', {
        method: 'POST',
        body: JSON.stringify({ companyLinkedinUrl })
      });
    },
    onSuccess: async (data) => {
      if (data.success) {
        setCompanyProfile(data.company);
        // After company data is loaded, generate the email
        // The email composer will be shown automatically after generation
        await generateApplicationEmail(data.company);
      }
    },
  });

  const generateApplicationEmail = async (companyData: any) => {
    setIsGeneratingEmail(true);
    setApplyStep('generating-email');
    
    try {
      const jobPosterData = {
        name: job.jobPosterName || "Hiring Manager",
        headline: job.jobPosterName ? `Professional at ${job.companyName}` : "",
        about: ""
      };

      const requestBody = {
        companyData: companyData || { name: job.companyName },
        jobPosterData,
        jobDescription: job.requirement || `${job.title} position at ${job.companyName}`,
        jobTitle: job.title,
        recipientEmail: job.jobPosterEmail || "",
        resumeText: resumeText
      };

      const data = await apiRequest('/api/generate-email', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (data.success) {
        setGeneratedEmail(data.email);
        setApplyStep('ready');
        // Close any loading modals
        setShowCompanyModal(false);
        setShowLoadingModal(false);
        // Show the email composer with generated email
        setShowEmailComposer(true);
      } else {
        console.error("Email generation failed:", data.error);
        setApplyStep('idle');
        setShowLoadingModal(false);
        alert(`Email generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error generating email:", error);
      setApplyStep('idle');
      setShowLoadingModal(false);
      alert(`Error generating email: ${error.message || 'Please check if you are logged in'}`);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleApplyClick = async () => {
    try {
      // Step 1: Check Gmail authorization
      setApplyStep('checking-gmail');
      const result = await refetchGmailStatus();
      const status = result?.data;
      
      if (!status?.authorized || status?.needsRefresh) {
        // User needs Gmail authorization first
        setApplyStep('idle');
        setShowGmailAuth(true);
        return;
      }

      // Step 2: Scrape company data if available
      if (job.companyLinkedinUrl) {
        setApplyStep('scraping-company');
        setShowLoadingModal(true);
        companyMutation.mutate(job.companyLinkedinUrl);
      } else {
        // Step 3: Generate email directly
        setApplyStep('generating-email');
        setShowLoadingModal(true);
        await generateApplicationEmail(null);
      }
    } catch (error) {
      console.error('Error in apply flow:', error);
      setApplyStep('idle');
      // Fallback: show email composer with empty email
      setShowEmailComposer(true);
    }
  };

  const handleProceedToApply = () => {
    setShowCompanyModal(false);
    setShowEmailComposer(true);
  };

  const handleRegenerateEmail = () => {
    // Prevent multiple concurrent requests
    if (isGeneratingEmail || applyStep !== 'idle') {
      console.log("Email generation already in progress");
      return;
    }
    
    // Reset generated email and regenerate
    setGeneratedEmail("");
    setApplyStep('generating-email');
    
    // Generate email immediately without delay
    if (job.companyLinkedinUrl && !companyProfile) {
      setApplyStep('scraping-company');
      companyMutation.mutate(job.companyLinkedinUrl);
    } else {
      generateApplicationEmail(companyProfile);
    }
  };
  const handleViewJob = () => {
    window.open(job.link, "_blank", "noopener,noreferrer");
  };

  const handleViewCompany = () => {
    window.open(job.companyWebsite, "_blank", "noopener,noreferrer");
  };

  const handleViewCompanyLinkedIn = () => {
    window.open(job.companyLinkedinUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewPoster = () => {
    if (job.jobPosterLinkedinUrl) {
      window.open(job.jobPosterLinkedinUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {job.companyLogo ? (
            <img 
              src={job.companyLogo} 
              alt={`${job.companyName} logo`} 
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/10" 
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Building className="h-7 w-7 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer mb-2 flex items-center gap-2"
              onClick={handleViewJob}
            >
              {job.title}
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span 
                className="font-medium hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
                onClick={handleViewCompany}
              >
                <Building className="h-3 w-3" />
                {job.companyName}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 mr-1" />
                {job.location}
              </span>
              {job.salaryInfo && (
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {job.salaryInfo}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {job.canApply ? (
            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
              <CheckCircle className="h-3 w-3 mr-1" />
              Can Apply
            </Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground border-muted font-semibold">
              <XCircle className="h-3 w-3 mr-1" />
              Cannot Apply
            </Badge>
          )}
          {job.canApply && (
            <Button 
              size="sm" 
              className="tech-btn"
              onClick={handleApplyClick}
              disabled={applyStep !== 'idle'}
            >
              {applyStep === 'idle' && (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Apply
                </>
              )}
              {applyStep === 'checking-gmail' && (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Checking Gmail...
                </>
              )}
              {applyStep === 'scraping-company' && (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading Company...
                </>
              )}
              {applyStep === 'generating-email' && (
                <>
                  <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                  Generating Email...
                </>
              )}
              {applyStep === 'ready' && (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {job.requirement && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {job.requirement}
          </p>
        </div>
      )}
      
      {job.jobPosterName && (
        <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Job Poster:</span>
              <span 
                className="text-sm text-primary hover:underline cursor-pointer transition-colors"
                onClick={handleViewPoster}
              >
                {job.jobPosterName}
              </span>
            </div>
            {job.jobPosterLinkedinUrl && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewPoster}
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          {job.jobPosterEmail && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Email:</span>
                <a 
                  href={`mailto:${job.jobPosterEmail}`}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  {job.jobPosterEmail}
                </a>
                {job.emailVerificationStatus && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      job.emailVerificationStatus === 'valid' 
                        ? 'bg-primary/10 text-primary' 
                        : job.emailVerificationStatus === 'catch-all' 
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : job.emailVerificationStatus === 'error'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {job.emailVerificationStatus}
                  </Badge>
                )}
              </div>
              {job.emailVerificationStatus && (
                <div className="flex items-center space-x-2">
                  {job.emailVerificationStatus === 'valid' && (
                    <Button 
                      size="sm" 
                      className="tech-btn"
                      onClick={handleApplyClick}
                      disabled={applyStep !== 'idle'}
                    >
                      {applyStep === 'idle' && (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Apply
                        </>
                      )}
                      {applyStep === 'checking-gmail' && (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Checking...
                        </>
                      )}
                      {applyStep === 'scraping-company' && (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Loading...
                        </>
                      )}
                      {applyStep === 'generating-email' && (
                        <>
                          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                          Generating...
                        </>
                      )}
                      {applyStep === 'ready' && (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </>
                      )}
                    </Button>
                  )}
                  {job.emailVerificationStatus === 'catch-all' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-yellow-600 text-yellow-600 hover:bg-yellow-500/10"
                      onClick={handleApplyClick}
                      disabled={applyStep !== 'idle'}
                    >
                      {applyStep === 'idle' && (
                        <>
                          <Mail className="h-3 w-3 mr-1" />
                          Risky Apply
                        </>
                      )}
                      {applyStep !== 'idle' && (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      )}
                    </Button>
                  )}
                  {job.emailVerificationStatus === 'error' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-muted-foreground text-muted-foreground hover:bg-muted"
                      onClick={handleApplyClick}
                      disabled={applyStep !== 'idle'}
                    >
                      {applyStep === 'idle' && (
                        <>
                          <Mail className="h-3 w-3 mr-1" />
                          Generate Email
                        </>
                      )}
                      {applyStep !== 'idle' && (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-3 text-sm">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewCompany}
            className="hover:bg-secondary transition-all duration-300"
          >
            <Briefcase className="h-3 w-3 mr-1" />
            Company
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewCompanyLinkedIn}
            className="text-primary hover:bg-primary/10 transition-all duration-300"
          >
            LinkedIn
          </Button>
        </div>
        <Button 
          onClick={handleViewJob}
          size="sm"
          className="tech-btn"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View Job
        </Button>
      </div>
      
      {/* Company Profile Modal */}
      <CompanyProfileModal 
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companyProfile={companyProfile}
        isLoading={companyMutation.isPending}
        jobEmail={job.jobPosterEmail}
        onProceedToApply={handleProceedToApply}
        generatedEmail={generatedEmail}
        isGeneratingEmail={isGeneratingEmail}
      />
      
      {/* Gmail Authorization Prompt */}
      {showGmailAuth && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">Enable Gmail Sending</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              To send job applications directly, we need permission to send emails on your behalf. 
              You can use any Gmail account for sending.
            </p>
            
            <div className="bg-muted/50 p-3 rounded-md mb-4">
              <p className="text-xs text-muted-foreground">
                <strong>Privacy:</strong> We only request email sending permission. 
                We cannot read your emails or access personal data.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGmailAuth(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  window.location.href = '/api/auth/gmail/authorize';
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Authorize Gmail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal for Email Generation */}
      {showLoadingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {applyStep === 'scraping-company' && <Building className="w-6 h-6 text-primary" />}
                    {applyStep === 'generating-email' && <Sparkles className="w-6 h-6 text-primary" />}
                    {applyStep === 'checking-gmail' && <Mail className="w-6 h-6 text-primary" />}
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {applyStep === 'checking-gmail' && 'Verifying Gmail Access'}
                  {applyStep === 'scraping-company' && 'Analyzing Company Profile'}
                  {applyStep === 'generating-email' && 'Generating Personalized Email'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {applyStep === 'checking-gmail' && 'Checking your Gmail authorization status...'}
                  {applyStep === 'scraping-company' && 'Gathering company insights to personalize your application...'}
                  {applyStep === 'generating-email' && 'Creating a compelling email tailored to this opportunity...'}
                </p>
              </div>
              
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email Composer Modal */}
      <EmailComposerModal 
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        recipientEmail={job.jobPosterEmail || ""}
        jobTitle={job.title}
        companyName={job.companyName}
        jobUrl={job.link}
        companyWebsite={job.companyWebsite}
        generatedEmail={generatedEmail}
        isGeneratingEmail={isGeneratingEmail}
        onRegenerateEmail={handleRegenerateEmail}
        showRegenerateButton={!!generatedEmail}
      />
    </motion.div>
  );
}