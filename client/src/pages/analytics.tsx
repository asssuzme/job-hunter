import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, TrendingUp, Calendar, Target, Mail, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Analytics() {
  const { user } = useAuth();

  if (!user) return null;

  // Mock analytics data
  const stats = {
    totalApplications: 15,
    responseRate: 33,
    averageResponseTime: 3.5,
    interviewsScheduled: 5,
    weeklyApplications: [
      { week: "Week 1", count: 3 },
      { week: "Week 2", count: 5 },
      { week: "Week 3", count: 4 },
      { week: "Week 4", count: 3 }
    ]
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={() => window.location.href = "/api/logout"} 
      title="Analytics"
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
              <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Track your job search performance and insights
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalApplications}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.responseRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.averageResponseTime}d</span>
            </div>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">{stats.interviewsScheduled}</span>
            </div>
            <p className="text-sm text-muted-foreground">Interviews</p>
          </motion.div>
        </div>

        {/* Weekly Applications Chart */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Application Trend</h3>
          <div className="space-y-4">
            {stats.weeklyApplications.map((week, index) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{week.week}</span>
                  <span className="font-medium">{week.count} applications</span>
                </div>
                <Progress 
                  value={(week.count / 10) * 100} 
                  className="h-2"
                />
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Insights */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Key Insights
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm">
                <span className="font-medium text-green-600">Great job!</span> Your response rate is above average at 33%
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm">
                <span className="font-medium text-blue-600">Tip:</span> Apply to 5-10 jobs per week for best results
              </p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm">
                <span className="font-medium text-accent">Trend:</span> Your application volume is consistent
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}