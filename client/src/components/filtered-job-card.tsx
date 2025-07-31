import { FilteredJobData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, User, Briefcase, DollarSign } from "lucide-react";

interface FilteredJobCardProps {
  job: FilteredJobData;
}

export function FilteredJobCard({ job }: FilteredJobCardProps) {
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
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Filtered
          </Badge>
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
          <div className="flex items-center justify-between">
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
    </div>
  );
}