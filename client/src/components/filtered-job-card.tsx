import { useState } from "react";
import { FilteredJobData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, User, Briefcase, DollarSign, Mail, CheckCircle, XCircle } from "lucide-react";
import { CompanyProfileModal } from "./company-profile-modal";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FilteredJobCardProps {
  job: FilteredJobData;
}

export function FilteredJobCard({ job }: FilteredJobCardProps) {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string>("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const companyMutation = useMutation({
    mutationFn: async (companyLinkedinUrl: string) => {
      const response = await apiRequest('POST', '/api/scrape-company', { companyLinkedinUrl });
      return response.json();
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
    try {
      // For now, we'll use placeholder job poster data since we don't have it stored
      // In a full implementation, this would come from the enriched job data
      const jobPosterData = {
        name: job.jobPosterName,
        headline: "Professional at " + job.companyName,
        about: ""
      };

      const response = await apiRequest('POST', '/api/generate-email', {
        companyData,
        jobPosterData,
        jobDescription: job.requirement || `${job.title} position at ${job.companyName}`,
        jobTitle: job.title,
        recipientEmail: job.jobPosterEmail
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedEmail(data.email);
      }
    } catch (error) {
      console.error("Error generating email:", error);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleApplyClick = () => {
    setShowCompanyModal(true);
    if (job.companyLinkedinUrl && !companyProfile) {
      companyMutation.mutate(job.companyLinkedinUrl);
    }
  };

  const handleProceedToApply = () => {
    const subject = encodeURIComponent(`Application for ${job.title} position`);
    const body = encodeURIComponent(generatedEmail);
    window.open(`mailto:${job.jobPosterEmail}?subject=${subject}&body=${body}`, '_blank');
    setShowCompanyModal(false);
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {job.companyLogo && (
            <img 
              src={job.companyLogo} 
              alt={`${job.companyName} logo`} 
              className="w-12 h-12 rounded-lg object-cover border border-gray-200" 
            />
          )}
          {!job.companyLogo && (
            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-2"
              onClick={handleViewJob}
            >
              {job.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <span 
                className="font-medium hover:text-blue-600 cursor-pointer transition-colors"
                onClick={handleViewCompany}
              >
                {job.companyName}
              </span>
              <span className="flex items-center">
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
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Can Apply
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <XCircle className="h-3 w-3 mr-1" />
              Cannot Apply
            </Badge>
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
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Job Poster:</span>
              <span 
                className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer transition-colors"
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
                className="text-blue-600 hover:text-blue-500"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          {job.jobPosterEmail && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <a 
                  href={`mailto:${job.jobPosterEmail}`}
                  className="text-sm text-green-600 hover:text-green-500 transition-colors"
                >
                  {job.jobPosterEmail}
                </a>
                {job.emailVerificationStatus && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      job.emailVerificationStatus === 'valid' 
                        ? 'bg-green-100 text-green-700' 
                        : job.emailVerificationStatus === 'catch-all' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : job.emailVerificationStatus === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
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
                      className="bg-green-600 hover:bg-green-700 text-white"
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
                      className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                      onClick={handleApplyClick}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Risky Apply
                    </Button>
                  )}
                  {job.emailVerificationStatus === 'error' && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-gray-200 text-gray-600 cursor-not-allowed"
                      disabled
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Worth
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 text-sm">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewCompany}
            className="text-gray-600 hover:text-gray-700"
          >
            <Briefcase className="h-3 w-3 mr-1" />
            Company
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewCompanyLinkedIn}
            className="text-blue-600 hover:text-blue-500"
          >
            LinkedIn
          </Button>
        </div>
        <Button 
          onClick={handleViewJob}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
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
    </div>
  );
}