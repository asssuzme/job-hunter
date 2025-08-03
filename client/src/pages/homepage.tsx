import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Briefcase, 
  Sparkles, 
  Search, 
  Mail, 
  CheckCircle, 
  Shield, 
  TrendingUp,
  Users,
  Globe,
  Award,
  Zap
} from "lucide-react";
import Footer from "@/components/footer";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold">AutoApply.ai</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <a 
                href="https://autoapply-ai.replit.app" 
                className="btn-primary text-sm px-4 py-2"
              >
                Launch App
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        <div className="container mx-auto px-4 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4" variant="outline">
              <Sparkles className="h-3 w-3 mr-2" />
              AI-Powered Job Applications
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Apply to Jobs 10x Faster with AI
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              AutoApply.ai automates your job search by finding relevant positions, discovering contact information, and crafting personalized applications using AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://autoapply-ai.replit.app"
                className="btn-primary px-8 py-4 text-lg group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="https://autoapply-ai.replit.app"
                className="px-8 py-4 text-lg border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
              >
                View Demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-2" />
              Features
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Land Your Dream Job</h2>
            <p className="text-xl text-muted-foreground">
              Powerful tools to streamline your job search process
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Smart Job Discovery",
                description: "AI-powered search finds the most relevant jobs from LinkedIn based on your preferences and experience.",
              },
              {
                icon: Users,
                title: "Contact Discovery",
                description: "Automatically finds hiring manager and recruiter contact information for direct outreach.",
              },
              {
                icon: Mail,
                title: "AI Email Writer",
                description: "Generates personalized application emails based on your resume and the job requirements.",
              },
              {
                icon: TrendingUp,
                title: "Application Tracking",
                description: "Track all your applications in one place with status updates and analytics.",
              },
              {
                icon: Shield,
                title: "Gmail Integration",
                description: "Send emails directly from your Gmail account with secure OAuth authentication.",
              },
              {
                icon: Globe,
                title: "Global Job Search",
                description: "Search for jobs worldwide with support for multiple locations and remote positions.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4">
              <Award className="h-3 w-3 mr-2" />
              Trusted by Job Seekers
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Join Thousands of Successful Job Seekers</h2>
            <p className="text-xl text-muted-foreground mb-12">
              Our platform has helped professionals land jobs at top companies
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { number: "10,000+", label: "Jobs Applied" },
                { number: "2,500+", label: "Users" },
                { number: "500+", label: "Companies" },
                { number: "85%", label: "Success Rate" },
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-blue-400">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-12 text-center border border-white/10"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start applying to jobs smarter, not harder. Join AutoApply.ai today and land your dream job faster.
            </p>
            <a 
              href="https://autoapply-ai.replit.app"
              className="btn-primary px-8 py-4 text-lg inline-flex items-center gap-2 group"
            >
              <Mail className="h-5 w-5" />
              Get Started Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free plan available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}