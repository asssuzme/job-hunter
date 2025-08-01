import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Mail, ExternalLink, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Applications() {
  const { user } = useAuth();
  
  // Fetch real email applications from the API
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/email-applications'],
    enabled: !!user,
  });

  if (!user) return null;

  // Helper function to format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={() => window.location.href = "/api/auth/logout"} 
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
              <h1 className="text-2xl font-bold mb-2">Email Applications</h1>
              <p className="text-muted-foreground">
                Track all your job applications sent via email
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{applications.length}</span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="glass-card p-12 text-center">
              <Loader2 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Loading Applications...</h3>
            </Card>
          ) : applications.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <Mail className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Email Applications Yet</h3>
              <p className="text-muted-foreground">
                Start sending job applications and they will appear here
              </p>
            </Card>
          ) : (
            applications.map((app: any, index: number) => (
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
                    <p className="text-muted-foreground mb-3">{app.companyName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Sent on {formatDate(app.sentAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {app.companyEmail}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Sent
                    </Badge>
                    <div className="flex gap-2">
                      {app.jobUrl && (
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="View Job"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {app.companyWebsite && (
                        <a
                          href={app.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Company Website"
                        >
                          <Briefcase className="h-4 w-4" />
                        </a>
                      )}
                    </div>
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