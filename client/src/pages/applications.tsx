import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Applications() {
  const { user } = useAuth();

  if (!user) return null;

  // Mock data for now - in a real app, this would come from the API
  const applications = [
    {
      id: 1,
      jobTitle: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      appliedDate: "2025-01-28",
      status: "pending",
      email: "hiring@techcorp.com"
    },
    {
      id: 2,
      jobTitle: "Full Stack Engineer",
      company: "StartupXYZ",
      appliedDate: "2025-01-25",
      status: "viewed",
      email: "jobs@startupxyz.com"
    },
    {
      id: 3,
      jobTitle: "React Developer",
      company: "Digital Agency",
      appliedDate: "2025-01-20",
      status: "rejected",
      email: "careers@digitalagency.com"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'viewed':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Viewed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={() => window.location.href = "/api/logout"} 
      title="Applications"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Job Applications</h1>
              <p className="text-muted-foreground">
                Track and manage all your job applications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{applications.length}</span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <Briefcase className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground">
                Start searching for jobs and your applications will appear here
              </p>
            </Card>
          ) : (
            applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{app.jobTitle}</h3>
                    <p className="text-muted-foreground mb-3">{app.company}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied on {new Date(app.appliedDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {app.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(app.status)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}