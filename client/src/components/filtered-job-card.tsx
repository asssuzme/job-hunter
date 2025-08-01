import { useState, useRef } from "react";
import { FilteredJobData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, User, Briefcase, DollarSign, Mail, CheckCircle, XCircle, Send, Loader2, Sparkles, Globe, Building } from "lucide-react";
import { CompanyProfileModal } from "./company-profile-modal";
import { EmailComposerModal } from "./email-composer-modal";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface FilteredJobCardProps {
  job: FilteredJobData;
  resumeText?: string | null;
}

export function FilteredJobCard({ job, resumeText }: FilteredJobCardProps) {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string>("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        await generateApplicationEmail(data.company);
      }
    },
  });

  const generateApplicationEmail = async (companyData: any) => {
    setIsGeneratingEmail(true);
    console.log("Starting email generation with company data:", companyData);
    console.log("Resume text available:", !!resumeText);
    
    try {
      // For now, we'll use placeholder job poster data since we don't have it stored
      // In a full implementation, this would come from the enriched job data
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

      console.log("Email generation request body:", requestBody);

      const data = await apiRequest('/api/generate-email', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      console.log("Email generation response:", data);
      
      if (data.success) {
        setGeneratedEmail(data.email);
        console.log("Email generated successfully");
      } else {
        console.error("Email generation failed:", data.error);
        alert(`Email generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error generating email:", error);
      alert(`Error generating email: ${error.message || 'Please check if you are logged in'}`);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleApplyClick = () => {
    setShowEmailComposer(true);
    // Generate email if not already generated
    if (!generatedEmail && !isGeneratingEmail) {
      if (job.companyLinkedinUrl) {
        setShowCompanyModal(true);
        companyMutation.mutate(job.companyLinkedinUrl);
      } else {
        // Generate email without company data
        generateApplicationEmail(null);
      }
    }
  };

  const handleProceedToApply = () => {
    setShowCompanyModal(false);
    setShowEmailComposer(true);
  };

  const handleRegenerateEmail = () => {
    // Clear any existing timeout
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
    }
    
    // Prevent multiple concurrent requests
    if (isGeneratingEmail) {
      console.log("Email generation already in progress");
      return;
    }
    
    // Add a small debounce to prevent accidental double clicks
    regenerateTimeoutRef.current = setTimeout(() => {
      if (job.companyLinkedinUrl && !companyProfile) {
        companyMutation.mutate(job.companyLinkedinUrl);
      } else {
        generateApplicationEmail(companyProfile);
      }
    }, 300);
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
            >
              <Send className="h-3 w-3 mr-1" />
              Generate Email
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
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  )}
                  {job.emailVerificationStatus === 'catch-all' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-yellow-600 text-yellow-600 hover:bg-yellow-500/10"
                      onClick={handleApplyClick}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Risky Apply
                    </Button>
                  )}
                  {job.emailVerificationStatus === 'error' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-muted-foreground text-muted-foreground hover:bg-muted"
                      onClick={handleApplyClick}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Generate Email
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
      />
    </motion.div>
  );
}