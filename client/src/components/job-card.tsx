import { JobData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Clock, ExternalLink, Share, Eye, Bookmark } from "lucide-react";

interface JobCardProps {
  job: JobData;
}

export function JobCard({ job }: JobCardProps) {
  const handleViewOriginal = () => {
    window.open(job.originalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {job.company.logo && (
            <img 
              src={job.company.logo} 
              alt={`${job.company.name} logo`} 
              className="w-12 h-12 rounded-lg object-cover border border-gray-200" 
            />
          )}
          {!job.company.logo && (
            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
              {job.title}
            </h3>
            <p className="text-sm font-medium text-gray-700">{job.company.name}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {job.location}
              </span>
              <span className="flex items-center">
                <Briefcase className="h-3 w-3 mr-1" />
                {job.workType}
              </span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {job.postedDate}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {job.applicants && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {job.applicants}
            </Badge>
          )}
          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 line-clamp-3">
          {job.description}
        </p>
      </div>
      
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Skills</h4>
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="outline" className="bg-gray-50 text-gray-500">
                +{job.skills.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {job.company.industry && (
            <div>
              <span className="font-medium text-gray-700">Industry:</span>
              <span className="text-gray-600 ml-1">{job.company.industry}</span>
            </div>
          )}
          {job.company.size && (
            <div>
              <span className="font-medium text-gray-700">Company Size:</span>
              <span className="text-gray-600 ml-1">{job.company.size}</span>
            </div>
          )}
          {job.company.founded && (
            <div>
              <span className="font-medium text-gray-700">Founded:</span>
              <span className="text-gray-600 ml-1">{job.company.founded}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <Button 
          variant="link" 
          onClick={handleViewOriginal}
          className="text-blue-600 hover:text-blue-500 p-0 h-auto"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View on LinkedIn
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
